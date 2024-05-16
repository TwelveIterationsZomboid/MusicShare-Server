import moment from 'moment';

type YouTubeVideos = {
	items: {
		contentDetails: {
			duration: string;
		};
		snippet: {
			title: string;
		};
	}[];
};

function replaceNonAscii(input: string): string {
	// Normalize the string: decompose it and then remove the combining characters
	let normalized = input.normalize('NFD');
	normalized = normalized.replace(/[^\x00-\x7F]/g, '');

	// Handle specific replacements
	const replacements: { [key: string]: string } = {
		ä: 'ae',
		ö: 'oe',
		ü: 'ue',
		ß: 'ss',
		æ: 'ae',
		œ: 'oe',
		å: 'a',
		ø: 'o',
		é: 'e',
		è: 'e',
		ê: 'e',
		ë: 'e',
		ç: 'c',
		í: 'i',
		ì: 'i',
		î: 'i',
		ï: 'i',
		á: 'a',
		à: 'a',
		â: 'a',
		ã: 'a',
		ó: 'o',
		ò: 'o',
		ô: 'o',
		õ: 'o',
		ú: 'u',
		ù: 'u',
		û: 'u',
		ñ: 'n',
		ý: 'y',
		ÿ: 'y',
		ř: 'r',
		ł: 'l',
		đ: 'd',
		š: 's',
		ž: 'z',
		č: 'c',
		// ... add other replacements as needed
	};

	for (const key in replacements) {
		normalized = normalized.replace(new RegExp(key, 'g'), replacements[key]);
	}

	return normalized;
}

function cleanTitle(title: string): string {
	const patterns = ['\\(Lyrics\\)', '\\(Official Video\\)', '\\(Explicit\\)', '\\(Official Music Video\\)', '\\(Music Video\\)'];

	let cleanedTitle = title.trim();
	patterns.forEach((pattern) => {
		const regex = new RegExp(pattern, 'i');
		cleanedTitle = cleanedTitle.replace(regex, '').trim();
	});

	return cleanedTitle;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const query = new URL(request.url).searchParams;
		const videoId = query.get('v');
		const apiKey = env.YOUTUBE_API_KEY;
		const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`;
		const response = await fetch(apiUrl);
		const videos = (await response.json()) as YouTubeVideos;
		const video = videos.items[0];
		if (!video) {
			return new Response('Video not found', { status: 404 });
		}
		const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
		const durationInSeconds = moment.duration(video.contentDetails.duration).asSeconds();
		const normalizedTitle = replaceNonAscii(video.snippet.title);
		const cleanedTitle = cleanTitle(normalizedTitle);
		return new Response(`${videoUrl}\n${cleanedTitle}\r\n${durationInSeconds}\n`);
	},
};
