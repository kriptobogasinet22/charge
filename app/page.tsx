export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">SafeMoneyRobot</h1>
      <p className="text-xl mb-4">Telegram Kripto Para Botu</p>
      <p className="text-lg mb-8">Bu bot, kripto para fiyatlarını gösterir ve dönüşüm yapar.</p>

      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Kurulum Adımları:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            Telegram'da{" "}
            <a
              href="https://t.me/BotFather"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              @BotFather
            </a>{" "}
            ile yeni bir bot oluşturun
          </li>
          <li>Bot token'ını TELEGRAM_BOT_TOKEN ortam değişkeni olarak ayarlayın</li>
          <li>Bu uygulamayı deploy edin</li>
          <li>
            Telegram API webhook'unu ayarlayın:{" "}
            <code className="bg-gray-200 px-2 py-1 rounded">
              https://api.telegram.org/bot[TOKEN]/setWebhook?url=[YOUR_DOMAIN]/api/telegram/webhook
            </code>
          </li>
        </ol>
      </div>
    </main>
  )
}
