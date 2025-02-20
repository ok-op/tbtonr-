const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

// টেলিগ্রাম বট টোকেন সেট করুন
const BOT_TOKEN = '7122909986:AAEiq3OoECmYYqIJmMPH_Vj7I7lz-7b-GZ4';
const bot = new Telegraf(BOT_TOKEN);

// Express সেটআপ (Cloudflare Workers-এর জন্য দরকার)
const app = express();
const PORT = 3000;

// 🎬 START Command Handler
bot.start((ctx) => {
    const message = `Hello👋 \n\n🗳 Get latest Movies from 1Tamilmv\n\n⚙️ *How to use me??*🤔\n\n✯ Please Enter /view command and you'll get magnet link as well as link to torrent file 😌\n\n🔗 Share and Support💝`;

    const keyboard = Markup.inlineKeyboard([
        Markup.button.url('🔗 GitHub 🔗', 'https://github.com/SudoR2spr'),
        Markup.button.url('⚡ Powered By', 'https://t.me/Opleech_WD'),
    ]);

    ctx.replyWithPhoto('https://graph.org/file/4e8a1172e8ba4b7a0bdfa.jpg', {
        caption: message,
        parse_mode: 'Markdown',
        ...keyboard,
    });
});

// 🎥 VIEW Command Handler
bot.command('view', async (ctx) => {
    await ctx.reply('*🧲 Please wait for 10 ⏰ seconds*', { parse_mode: 'Markdown' });

    const { movieList, realDict } = await tamilmv();
    if (movieList.length === 0) return ctx.reply('❌ No movies found.');

    const keyboard = Markup.inlineKeyboard(movieList.map((title, index) => 
        [Markup.button.callback(title, `${index}`)]
    ));

    ctx.replyWithPhoto('https://graph.org/file/4e8a1172e8ba4b7a0bdfa.jpg', {
        caption: '🔗 Select a Movie from the list 🎬 :\n\n🔘 Please select a movie:',
        parse_mode: 'Markdown',
        ...keyboard,
    });
});

// 🎬 Movie Selection Handler
bot.on('callback_query', async (ctx) => {
    const index = parseInt(ctx.callbackQuery.data);
    const { movieList, realDict } = await tamilmv();

    if (index < movieList.length) {
        const title = movieList[index];
        if (realDict[title]) {
            realDict[title].forEach((msg) => {
                ctx.reply(msg, { parse_mode: 'HTML' });
            });
        } else {
            ctx.reply('❌ Movie details not found.');
        }
    }
});

// 🌐 Tamilmv Scraper Function
async function tamilmv() {
    const url = 'https://www.1tamilmv.gold/';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
    };

    try {
        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);

        let movieList = [];
        let realDict = {};

        $('.ipsType_break.ipsContained').each((index, element) => {
            if (index < 21) {
                const title = $(element).find('a').text().trim();
                const link = $(element).find('a').attr('href');

                movieList.push(title);
                realDict[title] = [];
                
                getMovieDetails(link).then((details) => {
                    realDict[title] = details;
                });
            }
        });

        return { movieList, realDict };
    } catch (error) {
        console.error('Error fetching movies:', error);
        return { movieList: [], realDict: {} };
    }
}

// 📂 Fetch Movie Details
async function getMovieDetails(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let magnetLinks = $('a[href^="magnet:"]').map((_, el) => $(el).attr('href')).get();
        let fileLinks = $('a[data-fileext="torrent"]').map((_, el) => $(el).attr('href')).get();
        let movieTitle = $('h1').text().trim();

        let movieDetails = magnetLinks.map((mag, index) => {
            return `<b>📂 Movie Title:</b> ${movieTitle}\n🧲 <code>${mag}</code>\n\n🗒️-> <a href='${fileLinks[index] || "#"}'>Torrent File Download 🖇</a>`;
        });

        return movieDetails;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return [];
    }
}

// Express Route
app.get('/', (req, res) => res.send('Bot is Running!'));

// Start Bot & Server
bot.launch();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
