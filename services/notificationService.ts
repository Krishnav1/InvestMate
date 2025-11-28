export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendNotification = (title: string, body: string, icon = 'https://cdn-icons-png.flaticon.com/512/3594/3594458.png') => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    // Only send notification if document is hidden (user is away) or for critical alerts
    // For this demo, we'll send it if permitted.
    try {
        new Notification(title, {
            body,
            icon,
            tag: 'investmate-alert' 
        });
    } catch (e) {
        console.error("Notification failed", e);
    }
  }
};