import * as Notifications from 'expo-notifications';
import { supabase } from '../src/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupPushNotifications = async (userId: string) => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  await supabase
    .from('user_push_tokens')
    .upsert({ user_id: userId, expo_push_token: token });
};

export const sendPushNotification = async (token: string, title: string, body: string) => {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: 'default',
    }),
  });
};