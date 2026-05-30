import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ClockScreen from "../screens/ClockScreen";
import TimeHistoryScreen from "../screens/TimeHistoryScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { employee } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!employee ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "ShiftStack Login" }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ title: "Employee Dashboard" }}
            />
            <Stack.Screen
              name="Clock"
              component={ClockScreen}
              options={{ title: "Clock In / Out" }}
            />
            <Stack.Screen
              name="TimeHistory"
              component={TimeHistoryScreen}
              options={{ title: "My Time History" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
