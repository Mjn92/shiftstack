const pool = require("../config/db");
const { connectRabbitMQ } = require("../config/rabbitmq");

const CLOCK_IN_QUEUE = "clock_in_queue";
const CLOCK_OUT_QUEUE = "clock_out_queue";

const startClockWorker = async () => {
  const channel = await connectRabbitMQ();

  await channel.assertQueue(CLOCK_IN_QUEUE, {
    durable: true,
  });

  await channel.assertQueue(CLOCK_OUT_QUEUE, {
    durable: true,
  });

  console.log("Clock worker waiting for messages...");

  channel.consume(CLOCK_IN_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      const employeeId = data.employee_id;

      const openEntry = await pool.query(
        "SELECT id FROM time_entries WHERE employee_id = $1 AND status = 'open'",
        [employeeId],
      );

      if (openEntry.rows.length === 0) {
        await pool.query(
          `INSERT INTO time_entries (employee_id, clock_in, status)
           VALUES ($1, NOW(), 'open')`,
          [employeeId],
        );
      }

      channel.ack(msg);
      console.log(`Clock-in processed for employee ${employeeId}`);
    } catch (err) {
      console.error("Clock-in worker error:", err);
      channel.nack(msg, false, false);
    }
  });

  channel.consume(CLOCK_OUT_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      const employeeId = data.employee_id;

      const openEntry = await pool.query(
        `SELECT * FROM time_entries
         WHERE employee_id = $1 AND status = 'open'
         ORDER BY clock_in DESC
         LIMIT 1`,
        [employeeId],
      );

      if (openEntry.rows.length > 0) {
        const entry = openEntry.rows[0];

        await pool.query(
          `UPDATE time_entries
           SET clock_out = NOW(),
               total_minutes = FLOOR(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 60),
               status = 'closed'
           WHERE id = $1`,
          [entry.id],
        );
      }

      channel.ack(msg);
      console.log(`Clock-out processed for employee ${employeeId}`);
    } catch (err) {
      console.error("Clock-out worker error:", err);
      channel.nack(msg, false, false);
    }
  });
};

startClockWorker();
