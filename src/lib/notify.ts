export async function notifySlack(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[Slack通知スキップ] SLACK_WEBHOOK_URL未設定:", message);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[claude-updates-jp] ${message}`,
      }),
    });
  } catch (e) {
    console.error("Slack通知失敗:", (e as Error).message);
  }
}
