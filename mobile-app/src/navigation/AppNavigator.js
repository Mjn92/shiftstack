import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
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
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0A4DA2",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
          },
          headerBackTitleVisible: false,
          headerShadowVisible: false,

          headerBackImage: () => (
            <Ionicons name="arrow-back-circle" size={32} color="#FFFFFF" />
          ),
        }}
      >
        {!employee ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: "ShiftStack Login",
              headerShown: false,
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                title: "Employee Dashboard",
                headerBackVisible: false,
              }}
            />

            <Stack.Screen
              name="Clock"
              component={ClockScreen}
              options={{
                title: "Clock In / Out",
              }}
            />

            <Stack.Screen
              name="TimeHistory"
              component={TimeHistoryScreen}
              options={{
                title: "My Time History",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
