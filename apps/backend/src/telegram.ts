const TELEGRAM_API = "https://api.telegram.org";

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

export async function sendTelegramMessage(chatId: string, text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  const token = getBotToken();
  if (!token) {
    console.log("[telegram] No TELEGRAM_BOT_TOKEN set, skipping");
    return false;
  }

  try {
    const resp = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });
    if (!resp.ok) {
      console.error(`[telegram] sendMessage failed: ${resp.status} ${await resp.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
    return false;
  }
}

export function formatClaimNotification(params: {
  challengeIdx: number;
  earnedCount: number;
  totalCheckpoints: number;
  payoutTon: number;
  app: string;
  action: string;
}): string {
  return [
    `<b>Reward claimed</b>`,
    ``,
    `Challenge #${params.challengeIdx}`,
    `${params.app} / ${params.action}`,
    `Checkpoints: ${params.earnedCount}/${params.totalCheckpoints}`,
    `Payout: <b>${params.payoutTon.toFixed(4)} TON</b>`,
  ].join("\n");
}
