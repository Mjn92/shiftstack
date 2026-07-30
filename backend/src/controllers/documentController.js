const pool = require("../config/db");

const getDocuments = async (req, res) => {
  try {
    const role = req.user?.role;

    let allowedAudiences;

    switch (role) {
      case "employee":
        allowedAudiences = ["all", "employee"];
        break;

      case "manager":
        allowedAudiences = ["all", "employee", "manager"];
        break;

      case "admin":
        allowedAudiences = ["all", "employee", "manager", "admin"];
        break;

      default:
        return res.status(403).json({
          error: "You do not have permission to access documents.",
        });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          title,
          description,
          category,
          file_url,
          file_type,
          audience,
          created_at,
          updated_at
        FROM documents
        WHERE active = TRUE
          AND audience = ANY($1::text[])
        ORDER BY created_at DESC
      `,
      [allowedAudiences],
    );

    return res.status(200).json({
      documents: result.rows,
    });
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      error: "Could not load documents.",
    });
  }
};

module.exports = {
  getDocuments,
};
