import { Request, Response } from 'express';

interface Quote {
    quote: string;
    author: string;
    category: 'motivation' | 'anime' | 'life' | 'love' | 'wisdom';
    language: 'id' | 'en';
}

export const quotesDatabase: Quote[] = [
    // Motivation (ID)
    {
        quote: "Jadilah pribadi yang berilmu dan berakhlak, karena keduanya adalah kunci kesuksesan yang sejati.",
        author: "B.J. Habibie",
        category: "motivation",
        language: "id"
    },
    {
        quote: "Bermimpilah setinggi langit. Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.",
        author: "Ir. Soekarno",
        category: "motivation",
        language: "id"
    },
    {
        quote: "Banyak hal yang bisa menjatuhkanmu, tapi satu-satunya hal yang benar-benar dapat menjatuhkanmu adalah sikapmu sendiri.",
        author: "R.A. Kartini",
        category: "motivation",
        language: "id"
    },
    {
        quote: "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan Anda dapat mengubah dunia.",
        author: "Nelson Mandela",
        category: "motivation",
        language: "id"
    },
    {
        quote: "Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan.",
        author: "Albert Schweitzer",
        category: "motivation",
        language: "id"
    },
    {
        quote: "Waktu Anda terbatas, jadi jangan sia-siakan dengan menjalani hidup orang lain.",
        author: "Steve Jobs",
        category: "motivation",
        language: "id"
    },

    // Motivation (EN)
    {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        category: "motivation",
        language: "en"
    },
    {
        quote: "It always seems impossible until it's done.",
        author: "Nelson Mandela",
        category: "motivation",
        language: "en"
    },
    {
        quote: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson",
        category: "motivation",
        language: "en"
    },
    {
        quote: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt",
        category: "motivation",
        language: "en"
    },

    // Anime (ID & EN)
    {
        quote: "Aku tidak akan menarik kembali kata-kataku, karena itulah jalan ninjaku!",
        author: "Naruto Uzumaki (Naruto)",
        category: "anime",
        language: "id"
    },
    {
        quote: "Jika kamu tidak mengambil risiko, kamu tidak bisa menciptakan masa depan.",
        author: "Monkey D. Luffy (One Piece)",
        category: "anime",
        language: "id"
    },
    {
        quote: "Orang yang melanggar aturan adalah sampah, tapi mereka yang meninggalkan temannya lebih buruk dari sampah.",
        author: "Obito Uchiha (Naruto)",
        category: "anime",
        language: "id"
    },
    {
        quote: "Kekuatan sejati manusia adalah kemampuan untuk mengubah diri mereka sendiri.",
        author: "Saitama (One Punch Man)",
        category: "anime",
        language: "id"
    },
    {
        quote: "If you don't fight, you can't win!",
        author: "Eren Yeager (Attack on Titan)",
        category: "anime",
        language: "en"
    },
    {
        quote: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.",
        author: "Kenshin Himura (Rurouni Kenshin)",
        category: "anime",
        language: "en"
    },
    {
        quote: "Hard work betrays none, but dreams betray many.",
        author: "Hachiman Hikigaya (Oregairu)",
        category: "anime",
        language: "en"
    },

    // Life (ID)
    {
        quote: "Hidup itu seperti mengendarai sepeda. Untuk menjaga keseimbangan, Anda harus terus bergerak.",
        author: "Albert Einstein",
        category: "life",
        language: "id"
    },
    {
        quote: "Hiduplah seolah-olah kamu akan mati besok. Belajarlah seolah-olah kamu akan hidup selamanya.",
        author: "Mahatma Gandhi",
        category: "life",
        language: "id"
    },
    {
        quote: "Jangan menjelaskan tentang dirimu kepada siapapun, karena yang menyukaimu tidak butuh itu, dan yang membencimu tidak percaya itu.",
        author: "Ali bin Abi Thalib",
        category: "life",
        language: "id"
    },
    {
        quote: "Terkadang hal-hal terkecil mengambil ruang paling besar di hatimu.",
        author: "Winnie the Pooh",
        category: "life",
        language: "id"
    },

    // Life (EN)
    {
        quote: "Life is what happens when you're busy making other plans.",
        author: "John Lennon",
        category: "life",
        language: "en"
    },
    {
        quote: "In three words I can sum up everything I've learned about life: it goes on.",
        author: "Robert Frost",
        category: "life",
        language: "en"
    },

    // Love (ID & EN)
    {
        quote: "Cinta sejati itu memandang kelemahan lalu diubah menjadi sebuah kelebihan untuk saling melengkapi.",
        author: "B.J. Habibie",
        category: "love",
        language: "id"
    },
    {
        quote: "Cinta bukan tentang saling memandang, melainkan bersama-sama melihat ke satu arah yang sama.",
        author: "Antoine de Saint-Exupéry",
        category: "love",
        language: "id"
    },
    {
        quote: "The best thing to hold onto in life is each other.",
        author: "Audrey Hepburn",
        category: "love",
        language: "en"
    },

    // Wisdom (ID & EN)
    {
        quote: "Mengenal orang lain adalah kecerdasan; mengenal diri sendiri adalah kebijaksanaan sejati.",
        author: "Lao Tzu",
        category: "wisdom",
        language: "id"
    },
    {
        quote: "Satu-satunya kebijaksanaan sejati adalah mengetahui bahwa Anda tidak tahu apa-apa.",
        author: "Socrates",
        category: "wisdom",
        language: "id"
    },
    {
        quote: "Knowing yourself is the beginning of all wisdom.",
        author: "Aristotle",
        category: "wisdom",
        language: "en"
    },
    {
        quote: "Silence is a source of great strength.",
        author: "Lao Tzu",
        category: "wisdom",
        language: "en"
    }
];

export default async function quoteHandler(req: Request, res: Response) {
    try {
        const categoryParam = String(req.query.category || req.body?.category || '').toLowerCase().trim();
        const langParam = String(req.query.lang || req.body?.lang || '').toLowerCase().trim();
        const authorParam = String(req.query.author || req.body?.author || '').toLowerCase().trim();

        let filtered = quotesDatabase;

        if (categoryParam) {
            filtered = filtered.filter(q => q.category.toLowerCase() === categoryParam);
        }

        if (langParam) {
            filtered = filtered.filter(q => q.language.toLowerCase() === langParam);
        }

        if (authorParam) {
            filtered = filtered.filter(q => q.author.toLowerCase().includes(authorParam));
        }

        if (filtered.length === 0) {
            return res.status(404).json({
                status: false,
                category: 'quote',
                message: "Tidak ada quotes yang cocok dengan kriteria pencarian.",
                available_categories: ["motivation", "anime", "life", "love", "wisdom"],
                available_languages: ["id", "en"]
            });
        }

        const randomIndex = Math.floor(Math.random() * filtered.length);
        const selectedQuote = filtered[randomIndex];

        return res.json({
            status: true,
            category: 'quote',
            quote: selectedQuote.quote,
            author: selectedQuote.author,
            topic: selectedQuote.category,
            language: selectedQuote.language,
            result: selectedQuote,
            total_available: filtered.length
        });
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            category: 'quote',
            message: error?.message || "Internal Server Error"
        });
    }
}
