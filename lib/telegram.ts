import { getCoinPrices, convertCryptoToTRY, convertTRYToCrypto } from "./crypto"
import type { TelegramUpdate, TelegramMessage, InlineKeyboardMarkup } from "@/types"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPPORTED_COINS = ["BTC", "USDT", "TRX", "XMR", "DOGE"]

export async function handleUpdate(update: TelegramUpdate) {
  if (update.message) {
    await handleMessage(update.message)
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id
  const text = message.text?.toLowerCase()

  if (!text) return

  if (text === "/start" || text === "/menu") {
    await sendMainMenu(chatId)
  } else if (text.startsWith("/convert")) {
    const parts = text.split(" ")
    if (parts.length === 4) {
      // Format: /convert 100 try btc
      const amount = Number.parseFloat(parts[1])
      const fromCurrency = parts[2].toUpperCase()
      const toCurrency = parts[3].toUpperCase()

      if (!isNaN(amount)) {
        await handleConversion(chatId, amount, fromCurrency, toCurrency)
      } else {
        await sendMessage(chatId, "Geçersiz miktar. Lütfen sayısal bir değer girin.")
      }
    } else {
      await sendMessage(
        chatId,
        "Doğru format: /convert [miktar] [kaynak para birimi] [hedef para birimi]\nÖrnek: /convert 100 TRY BTC",
      )
    }
  }
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id
  const messageId = callbackQuery.message.message_id
  const data = callbackQuery.data

  if (data === "prices") {
    await sendCryptoPrices(chatId)
  } else if (data === "convert_menu") {
    await sendConversionMenu(chatId)
  } else if (data.startsWith("convert_to_try_")) {
    const coin = data.replace("convert_to_try_", "")
    await sendConversionPrompt(chatId, coin, "TRY")
  } else if (data.startsWith("convert_from_try_")) {
    const coin = data.replace("convert_from_try_", "")
    await sendConversionPrompt(chatId, "TRY", coin)
  } else if (data === "main_menu") {
    await sendMainMenu(chatId)
  }

  // Answer callback query to remove loading state
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQuery.id }),
  })
}

async function sendMainMenu(chatId: number | string) {
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: "💰 Güncel Fiyatlar", callback_data: "prices" }],
      [{ text: "🔄 Para Çevirici", callback_data: "convert_menu" }],
    ],
  }

  await sendMessage(
    chatId,
    "🤖 *SafeMoneyRobot*\n\nMerhaba! Kripto para fiyatlarını görmek veya dönüşüm yapmak için aşağıdaki menüyü kullanabilirsiniz.",
    keyboard,
  )
}

async function sendCryptoPrices(chatId: number | string) {
  try {
    const prices = await getCoinPrices(SUPPORTED_COINS)

    let message = "💰 *Güncel Kripto Para Fiyatları (TL)*\n\n"

    for (const coin of SUPPORTED_COINS) {
      const price = prices[coin.toLowerCase()]
      if (price) {
        message += `*${coin}*: ${price.toLocaleString("tr-TR")} ₺\n`
      }
    }

    message +=
      "\n_Son güncelleme: " +
      new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date()) +
      "_"

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: "🔄 Yenile", callback_data: "prices" }],
        [{ text: "⬅️ Ana Menü", callback_data: "main_menu" }],
      ],
    }

    await sendMessage(chatId, message, keyboard)
  } catch (error) {
    console.error("Error fetching prices:", error)
    await sendMessage(chatId, "Fiyatlar alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
  }
}

async function sendConversionMenu(chatId: number | string) {
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "TRY → BTC", callback_data: "convert_from_try_BTC" },
        { text: "BTC → TRY", callback_data: "convert_to_try_BTC" },
      ],
      [
        { text: "TRY → USDT", callback_data: "convert_from_try_USDT" },
        { text: "USDT → TRY", callback_data: "convert_to_try_USDT" },
      ],
      [
        { text: "TRY → TRX", callback_data: "convert_from_try_TRX" },
        { text: "TRX → TRY", callback_data: "convert_to_try_TRX" },
      ],
      [
        { text: "TRY → XMR", callback_data: "convert_from_try_XMR" },
        { text: "XMR → TRY", callback_data: "convert_to_try_XMR" },
      ],
      [
        { text: "TRY → DOGE", callback_data: "convert_from_try_DOGE" },
        { text: "DOGE → TRY", callback_data: "convert_to_try_DOGE" },
      ],
      [{ text: "⬅️ Ana Menü", callback_data: "main_menu" }],
    ],
  }

  await sendMessage(chatId, "🔄 *Para Çevirici*\n\nLütfen yapmak istediğiniz dönüşüm işlemini seçin:", keyboard)
}

async function sendConversionPrompt(chatId: number | string, fromCurrency: string, toCurrency: string) {
  await sendMessage(
    chatId,
    `Lütfen dönüştürmek istediğiniz ${fromCurrency} miktarını girin.\n\nÖrnek: /convert 100 ${fromCurrency} ${toCurrency}`,
  )
}

async function handleConversion(chatId: number | string, amount: number, fromCurrency: string, toCurrency: string) {
  try {
    let result: number
    let message: string

    if (fromCurrency === "TRY" && SUPPORTED_COINS.includes(toCurrency)) {
      result = await convertTRYToCrypto(amount, toCurrency)
      message = `💱 *Dönüşüm Sonucu*\n\n${amount.toLocaleString("tr-TR")} ₺ = ${result.toLocaleString("tr-TR", { maximumFractionDigits: 8 })} ${toCurrency}`
    } else if (SUPPORTED_COINS.includes(fromCurrency) && toCurrency === "TRY") {
      result = await convertCryptoToTRY(amount, fromCurrency)
      message = `💱 *Dönüşüm Sonucu*\n\n${amount.toLocaleString("tr-TR", { maximumFractionDigits: 8 })} ${fromCurrency} = ${result.toLocaleString("tr-TR")} ₺`
    } else {
      message = "Desteklenmeyen para birimi. Lütfen TRY ve desteklenen kripto paralar arasında dönüşüm yapın."
    }

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: "🔄 Başka Bir Dönüşüm", callback_data: "convert_menu" }],
        [{ text: "⬅️ Ana Menü", callback_data: "main_menu" }],
      ],
    }

    await sendMessage(chatId, message, keyboard)
  } catch (error) {
    console.error("Error converting currency:", error)
    await sendMessage(chatId, "Dönüşüm yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
  }
}

export async function sendMessage(chatId: number | string, text: string, replyMarkup?: InlineKeyboardMarkup) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  }

  if (replyMarkup) {
    body.reply_markup = replyMarkup
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Telegram API error:", errorData)
    throw new Error(`Telegram API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}
