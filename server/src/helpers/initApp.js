import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Card from '../models/cardModel.js';
import Hero from '../models/heroModel.js';
import Collection from '../models/collectionModel.js';
import User from '../models/userModel.js';
import { v4 } from 'uuid';
import { fetch } from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../../.env` });

const DB = process.env.DB.replace('<DB_PWD>', process.env.DB_PWD)
	.replace('<DB_USER>', process.env.DB_USER)
	.replaceAll('<DB_NAME>', process.env.DB_NAME)
	.replace('<DB_HOST>', process.env.DB_HOST)
	.replace('<DB_PORT>', process.env.DB_PORT);

mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => console.log('DB connection successful!'));

const rare = [
	{
		name: 'Annie',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Dangerous, yet disarmingly precocious, Annie is a child mage with immense pyromantic power.',
		front_image_path: '/src/assets/cards/rare/front/annie.webp',
		back_image_path: '/src/assets/cards/rare/back/annie.webp',
		hero_link: 'https://leagueoflegends.com/en-us/champions/annie/'
	},
	{
		name: 'Darius',
		rarity: 'Rare',
		role: 'Tank',
		description:
			"There is no greater symbol of Noxian might than Darius, the nation's most feared and battle-hardened commander.",
		front_image_path: '/src/assets/cards/rare/front/darius.webp',
		back_image_path: '/src/assets/cards/rare/back/darius.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/darius/'
	},
	{
		name: 'Ekko',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'A prodigy from the rough streets of Zaun, Ekko manipulates time to twist any situation to his advantage.',
		front_image_path: '/src/assets/cards/rare/front/ekko.webp',
		back_image_path: '/src/assets/cards/rare/back/ekko.webp',
		hero_link: 'https://leagueoflegends.com/en-us/champions/ekko/'
	},
	{
		name: 'Fizz',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description: 'Fizz is an amphibious yordle, who dwells among the reefs surrounding Bilgewater.',
		front_image_path: '/src/assets/cards/rare/front/fizz.webp',
		back_image_path: '/src/assets/cards/rare/back/fizz.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/fizz/'
	},
	{
		name: 'Fortune',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'A Bilgewater captain famed for her looks but feared for her ruthlessness, Sarah Fortune paints a stark figure among the hardened criminals of the port city. ',
		front_image_path: '/src/assets/cards/rare/front/fortune.webp',
		back_image_path: '/src/assets/cards/rare/back/fortune.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/miss-fortune/'
	},
	{
		name: 'Garen',
		rarity: 'Rare',
		role: 'Tank',
		description:
			'A proud and noble warrior, Garen fights as one of the Dauntless Vanguard. He is popular among his fellows, and respected well enough by his enemies.',
		front_image_path: '/src/assets/cards/rare/front/garen.webp',
		back_image_path: '/src/assets/cards/rare/back/garen.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/garen/'
	},
	{
		name: 'Gragas',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Equal parts jolly and imposing, Gragas is a massive, rowdy brewmaster on his own quest for the perfect pint of ale.',
		front_image_path: '/src/assets/cards/rare/front/gragas.webp',
		back_image_path: '/src/assets/cards/rare/back/gragas.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/gragas/'
	},
	{
		name: 'Graves',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Malcolm Graves is a renowned mercenary, gambler, and thief—a wanted man in every city and empire he has visited.',
		front_image_path: '/src/assets/cards/rare/front/graves.webp',
		back_image_path: '/src/assets/cards/rare/back/graves.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/graves/'
	},
	{
		name: 'Irelia',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'The Noxian occupation of Ionia produced many heroes, none more unlikely than young Irelia of Navori.',
		front_image_path: '/src/assets/cards/rare/front/irelia.webp',
		back_image_path: '/src/assets/cards/rare/back/irelia.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/irelia/'
	},
	{
		name: 'Katarina',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Decisive in judgment and lethal in combat, Katarina is a Noxian assassin of the highest caliber. Eldest daughter to the legendary General Du Couteau.',
		front_image_path: '/src/assets/cards/rare/front/katarina.webp',
		back_image_path: '/src/assets/cards/rare/back/katarina.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/katarina/'
	},
	{
		name: 'Kennen',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'More than just the lightning-quick enforcer of Ionian balance, Kennen is the only yordle member of the Kinkou.',
		front_image_path: '/src/assets/cards/rare/front/kennen.webp',
		back_image_path: '/src/assets/cards/rare/back/kennen.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/kennen/'
	},
	{
		name: 'Leona',
		rarity: 'Rare',
		role: 'Support',
		description:
			'Imbued with the fire of the sun, Leona is a holy warrior of the Solari who defends Mount Targon with her Zenith Blade and the Shield of Daybreak.',
		front_image_path: '/src/assets/cards/rare/front/leona.webp',
		back_image_path: '/src/assets/cards/rare/back/leona.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/leona/'
	},
	{
		name: 'Maokai',
		rarity: 'Rare',
		role: 'Tank',
		description:
			'Maokai is a rageful, towering treant who fights the unnatural horrors of the Shadow Isles.',
		front_image_path: '/src/assets/cards/rare/front/maokai.webp',
		back_image_path: '/src/assets/cards/rare/back/maokai.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/maokai/'
	},
	{
		name: 'Nocturne',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'A demonic amalgamation drawn from the nightmares that haunt every sentient mind, the thing known as Nocturne has become a primordial force of pure evil.',
		front_image_path: '/src/assets/cards/rare/front/nocturne.webp',
		back_image_path: '/src/assets/cards/rare/back/nocturne.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/nocturne/'
	},
	{
		name: 'Shaco',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Crafted long ago as a plaything for a lonely prince, the enchanted marionette Shaco now delights in murder and mayhem.',
		front_image_path: '/src/assets/cards/rare/front/shaco.webp',
		back_image_path: '/src/assets/cards/rare/back/shaco.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/shaco/'
	},
	{
		name: 'Signed',
		rarity: 'Rare',
		role: 'Tank',
		description:
			'Singed is a Zaunite alchemist of unmatched intellect, who has devoted his life to pushing the boundaries of knowledge.',
		front_image_path: '/src/assets/cards/rare/front/singed.webp',
		back_image_path: '/src/assets/cards/rare/back/singed.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/singed/'
	},
	{
		name: 'Sion',
		rarity: 'Rare',
		role: 'Tank',
		description:
			'A war hero from a bygone era, Sion was revered in Noxus for choking the life out of a Demacian king with his bare hands—but, denied oblivion, he was resurrected to serve his empire even in death.',
		front_image_path: '/src/assets/cards/rare/front/sion.webp',
		back_image_path: '/src/assets/cards/rare/back/sion.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/sion/'
	},
	{
		name: 'Syndra',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description: 'Syndra is a fearsome Ionian mage with incredible power at her command.',
		front_image_path: '/src/assets/cards/rare/front/syndra.webp',
		back_image_path: '/src/assets/cards/rare/back/syndra.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/syndra/'
	},
	{
		name: 'Veigar',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'An enthusiastic master of dark sorcery, Veigar has embraced powers that few mortals dare approach.',
		front_image_path: '/src/assets/cards/rare/front/veigar.webp',
		back_image_path: '/src/assets/cards/rare/back/veigar.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/veigar/'
	},
	{
		name: 'Vex',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'In the black heart of the Shadow Isles, a lone yordle trudges through the spectral fog, content in its murky misery.',
		front_image_path: '/src/assets/cards/rare/front/vex.webp',
		back_image_path: '/src/assets/cards/rare/back/vex.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/vex/'
	},
	{
		name: 'Vi',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Once a criminal from the mean streets of Zaun, Vi is a hotheaded, impulsive, and fearsome woman with only a very loose respect for authority figures.',
		front_image_path: '/src/assets/cards/rare/front/vi.webp',
		back_image_path: '/src/assets/cards/rare/back/vi.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/vi/'
	},
	{
		name: 'Viego',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Once ruler of a long-lost kingdom, Viego perished over a thousand years ago when his attempt to bring his wife back from the dead triggered the magical catastrophe known as the Ruination.',
		front_image_path: '/src/assets/cards/rare/front/viego.webp',
		back_image_path: '/src/assets/cards/rare/back/viego.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/viego/'
	},
	{
		name: 'Victor',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'The herald of a new age of technology, Viktor has devoted his life to the advancement of humankind. An idealist who seeks to lift the people of Zaun to a new level of understanding.',
		front_image_path: '/src/assets/cards/rare/front/viktor.webp',
		back_image_path: '/src/assets/cards/rare/back/viktor.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/viktor/'
	},
	{
		name: 'Vlad',
		rarity: 'Rare',
		role: 'Tank',
		description:
			"A fiend with a thirst for mortal blood, Vladimir has influenced the affairs of Noxus since the empire's earliest days.",
		front_image_path: '/src/assets/cards/rare/front/vlad.webp',
		back_image_path: '/src/assets/cards/rare/back/vlad.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/vladimir/'
	},
	{
		name: 'Volibear',
		rarity: 'Rare',
		role: 'Tank',
		description:
			'To those who still revere him, the Volibear is the storm made manifest. Destructive, wild, and stubbornly resolute, he existed before mortals walked the Freljord.',
		front_image_path: '/src/assets/cards/rare/front/volibear.webp',
		back_image_path: '/src/assets/cards/rare/back/volibear.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/volibear/'
	},
	{
		name: 'Warwick',
		rarity: 'Rare',
		role: 'Tank',
		description:
			'Warwick is a monster who hunts the gray alleys of Zaun. Transformed by agonizing experiments, half machine half beast.',
		front_image_path: '/src/assets/cards/rare/front/warwick.webp',
		back_image_path: '/src/assets/cards/rare/back/warwick.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/warwick/'
	},
	{
		name: 'Yasuo',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'An Ionian of deep resolve, Yasuo is an agile swordsman who wields the air itself against his enemies.',
		front_image_path: '/src/assets/cards/rare/front/yasuo.webp',
		back_image_path: '/src/assets/cards/rare/back/yasuo.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/yasuo/'
	},
	{
		name: 'Yone',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			"In life, he was Yone—half-brother of Yasuo, and renowned student of his village's sword school.",
		front_image_path: '/src/assets/cards/rare/front/yone.webp',
		back_image_path: '/src/assets/cards/rare/back/yone.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/yone/'
	},
	{
		name: 'Zac',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			"Zac is the product of a toxic spill that ran through a chemtech seam and pooled in an isolated cavern deep in Zaun's Sump.",
		front_image_path: '/src/assets/cards/rare/front/zac.webp',
		back_image_path: '/src/assets/cards/rare/back/zac.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/zac/'
	},
	{
		name: 'Zed',
		rarity: 'Rare',
		role: 'Burst Dealer',
		description:
			'Utterly ruthless and without mercy, Zed is the leader of the Order of Shadow, an organization he created with the intent of militarizing Ionia.',
		front_image_path: '/src/assets/cards/rare/front/zed.webp',
		back_image_path: '/src/assets/cards/rare/back/zed.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/zed/'
	}
];

const epic = [
	{
		name: 'Aatrox',
		rarity: 'Epic',
		role: 'Tank',
		description:
			'Once honored defenders of Shurima against the Void, Aatrox and his brethren would eventually become an even greater threat to Runeterra.',
		front_image_path: '/src/assets/cards/epic/front/aatrox.webp',
		back_image_path: '/src/assets/cards/epic/back/aatrox.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/aatrox/'
	},
	{
		name: 'Ahri',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Innately connected to the latent power Runeterra, Ahri is a vastaya who can reshape magic into ords of raw energy.',
		front_image_path: '/src/assets/cards/epic/front/ahri.webp',
		back_image_path: '/src/assets/cards/epic/back/ahri.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/ahri/'
	},
	{
		name: 'Alistar',
		rarity: 'Epic',
		role: 'Support',
		description:
			'Always a mighty warrior with a fearsome reputation, Alistar seeks revenge for the death of his clan at the hands of the Noxian empire.',
		front_image_path: '/src/assets/cards/epic/front/alistar.webp',
		back_image_path: '/src/assets/cards/epic/back/alistar.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/alistar/'
	},
	{
		name: 'Diana',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Bearing her crescent moonblade, Diana fights as a warrior of the Lunari—a faith all but quashed in the lands around Mount Targon.',
		front_image_path: '/src/assets/cards/epic/front/diana.webp',
		back_image_path: '/src/assets/cards/epic/back/diana.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/diana/'
	},
	{
		name: 'Ezreal',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'A dashing adventurer, unknowingly gifted in the magical arts, Ezreal raids long-lost catacombs, tangles with ancient curses, and overcomes seemingly impossible odds with ease.',
		front_image_path: '/src/assets/cards/epic/front/ezreal.webp',
		back_image_path: '/src/assets/cards/epic/back/ezreal.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/ezreal/'
	},
	{
		name: 'Jaximus',
		rarity: 'Epic',
		role: 'Tank',
		description:
			'Unmatched in both his skill with unique armaments and his biting sarcasm, Jax is the last known weapons master of Icathia.',
		front_image_path: '/src/assets/cards/epic/front/jaximus.webp',
		back_image_path: '/src/assets/cards/epic/back/jaximus.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/jax/'
	},
	{
		name: 'Nidale',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Raised in the deepest jungle, Nidalee is a master tracker who can shapeshift into a ferocious cougar at will. Neither wholly woman nor beast.',
		front_image_path: '/src/assets/cards/epic/front/nidale.webp',
		back_image_path: '/src/assets/cards/epic/back/nidale.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/nidalee/'
	},
	{
		name: 'Olaf',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'An unstoppable force of destruction, the axe-wielding Olaf wants nothing but to die in glorious combat.',
		front_image_path: '/src/assets/cards/epic/front/olaf.webp',
		back_image_path: '/src/assets/cards/epic/back/olaf.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/olaf/'
	},
	{
		name: 'Ori',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Once a curious girl of flesh and blood, Orianna is now a technological marvel comprised entirely of clockwork.',
		front_image_path: '/src/assets/cards/epic/front/ori.webp',
		back_image_path: '/src/assets/cards/epic/back/ori.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/orianna/'
	},
	{
		name: 'Panth',
		rarity: 'Epic',
		role: 'Tank',
		description:
			'Once an unwilling host to the Aspect of War, Atreus survived when the celestial power within him was slain, refusing to succumb to a blow that tore stars from the heavens.',
		front_image_path: '/src/assets/cards/epic/front/panth.webp',
		back_image_path: '/src/assets/cards/epic/back/panth.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/pantheon/'
	},
	{
		name: 'Poppy',
		rarity: 'Epic',
		role: 'Support',
		description:
			'Runeterra has no shortage of valiant champions, but few are as tenacious as Poppy.',
		front_image_path: '/src/assets/cards/epic/front/poppy.webp',
		back_image_path: '/src/assets/cards/epic/back/poppy.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/poppy/'
	},
	{
		name: 'Renekt',
		rarity: 'Epic',
		role: 'Tank',
		description:
			'Renekton is a terrifying, rage-fueled Ascended being from the scorched deserts of Shurima.',
		front_image_path: '/src/assets/cards/epic/front/renekt.webp',
		back_image_path: '/src/assets/cards/epic/back/renekt.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/renekton/'
	},
	{
		name: 'Riven',
		rarity: 'Epic',
		role: 'Tank',
		description:
			'Once a swordmaster in the warhosts of Noxus, Riven is an expatriate in a land she previously tried to conquer.',
		front_image_path: '/src/assets/cards/epic/front/riven.webp',
		back_image_path: '/src/assets/cards/epic/back/riven.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/riven/'
	},
	{
		name: 'Ryze',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Widely considered one of the most adept sorcerers on Runeterra, Ryze is an ancient, hard-bitten archmage with an impossibly heavy burden to bear.',
		front_image_path: '/src/assets/cards/epic/front/ryze.webp',
		back_image_path: '/src/assets/cards/epic/back/ryze.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/ryze/'
	},
	{
		name: 'Shen',
		rarity: 'Epic',
		role: 'Tank',
		description:
			'Among the secretive, Ionian warriors known as the Kinkou, Shen serves as their leader, the Eye of Twilight.',
		front_image_path: '/src/assets/cards/epic/front/shen.webp',
		back_image_path: '/src/assets/cards/epic/back/shen.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/shen/'
	},
	{
		name: 'Shyvana',
		rarity: 'Epic',
		role: 'Tank',
		description: 'Shyvana is a creature with the magic of a rune shard burning within her heart.',
		front_image_path: '/src/assets/cards/epic/front/shyvana.webp',
		back_image_path: '/src/assets/cards/epic/back/shyvana.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/shyvana/'
	},
	{
		name: 'Skarner',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Skarner is an immense crystalline scorpion from a hidden valley in Shurima. Part of the ancient Brackern race.',
		front_image_path: '/src/assets/cards/epic/front/skarner.webp',
		back_image_path: '/src/assets/cards/epic/back/skarner.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/skarner/'
	},
	{
		name: 'Tresh',
		rarity: 'Epic',
		role: 'Support',
		description:
			'Sadistic and cunning, Thresh is an ambitious and restless spirit of the Shadow Isles.',
		front_image_path: '/src/assets/cards/epic/front/tresh.webp',
		back_image_path: '/src/assets/cards/epic/back/tresh.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/thresh/'
	},
	{
		name: 'Xin Zhao',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Xin Zhao is a resolute warrior loyal to the ruling Lightshield dynasty. Horrendous yet merciful.',
		front_image_path: '/src/assets/cards/epic/front/xin-zhao.webp',
		back_image_path: '/src/assets/cards/epic/back/xin-zhao.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/xin-zhao/'
	},
	{
		name: 'Zyra',
		rarity: 'Epic',
		role: 'Burst Dealer',
		description:
			'Born in an ancient, sorcerous catastrophe, Zyra is the wrath of nature given form—an alluring hybrid of plant and human, kindling new life with every step.',
		front_image_path: '/src/assets/cards/epic/front/zyra.webp',
		back_image_path: '/src/assets/cards/epic/back/zyra.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/zyra/'
	}
];

const legendary = [
	{
		name: 'Azir',
		rarity: 'Legendary',
		role: 'Burst Dealer',
		description:
			'Azir was a mortal emperor of Shurima in a far distant age, a proud man who stood at the cusp of immortality.',
		front_image_path: '/src/assets/cards/legendary/front/azir.webp',
		back_image_path: '/src/assets/cards/legendary/back/azir.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/azir/'
	},
	{
		name: 'Lee Sin',
		rarity: 'Legendary',
		role: 'Tank',
		description:
			"A master of Ionia's ancient martial arts, Lee Sin is a principled fighter who channels the essence of the dragon spirit to face any challenge.",
		front_image_path: '/src/assets/cards/legendary/front/lee-sin.webp',
		back_image_path: '/src/assets/cards/legendary/back/lee-sin.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/lee-sin/'
	},
	{
		name: 'Master Yi',
		rarity: 'Legendary',
		role: 'Burst Dealer',
		description:
			'Master Yi has tempered his body and sharpened his mind, so that thought and action have become almost as one.',
		front_image_path: '/src/assets/cards/legendary/front/master-yi.webp',
		back_image_path: '/src/assets/cards/legendary/back/master-yi.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/master-yi/'
	},
	{
		name: 'Nilah',
		rarity: 'Legendary',
		role: 'Burst Dealer',
		description:
			"Nilah is an ascetic warrior from a distant land, seeking the world's deadliest, most titanic opponents so that she might challenge and destroy them.",
		front_image_path: '/src/assets/cards/legendary/front/nilah.webp',
		back_image_path: '/src/assets/cards/legendary/back/nilah.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/nilah/'
	},
	{
		name: 'Rakan',
		rarity: 'Legendary',
		role: 'Support',
		description:
			'As mercurial as he is charming, Rakan is an infamous vastayan troublemaker and the greatest battle-dancer in Lhotlan tribal history.',
		front_image_path: '/src/assets/cards/legendary/front/rakan.webp',
		back_image_path: '/src/assets/cards/legendary/back/rakan.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/rakan/'
	},
	{
		name: 'Rengar',
		rarity: 'Legendary',
		role: 'Burst Dealer',
		description:
			'Rengar is a ferocious vastayan trophy hunter who lives for the thrill of tracking down and killing dangerous creatures.',
		front_image_path: '/src/assets/cards/legendary/front/rengar.webp',
		back_image_path: '/src/assets/cards/legendary/back/rengar.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/rengar/'
	},
	{
		name: 'Sett',
		rarity: 'Legendary',
		role: 'Tank',
		description:
			"A leader of Ionia's growing criminal underworld, Sett rose to prominence in the wake of the war with Noxus.",
		front_image_path: '/src/assets/cards/legendary/front/sett.webp',
		back_image_path: '/src/assets/cards/legendary/back/sett.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/sett/'
	},
	{
		name: 'Trynda',
		rarity: 'Legendary',
		role: 'Burst Dealer',
		description:
			'Fueled by unbridled fury and rage, Tryndamere once carved his way through the Freljord, openly challenging the greatest warriors of the north to prepare himself for even darker days ahead.',
		front_image_path: '/src/assets/cards/legendary/front/trynda.webp',
		back_image_path: '/src/assets/cards/legendary/back/trynda.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/tryndamere/'
	},
	{
		name: 'Velkoz',
		rarity: 'Legendary',
		role: 'Burst Dealer',
		description:
			"It is unclear if Vel'Koz was the first Void-spawn to emerge on Runeterra, but there has certainly never been another to match his level of cruel, calculating sentience.",
		front_image_path: '/src/assets/cards/legendary/front/velkoz.webp',
		back_image_path: '/src/assets/cards/legendary/back/velkoz.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/vel-koz/'
	},
	{
		name: 'Yuumi',
		rarity: 'Legendary',
		role: 'Support',
		description:
			'A magical cat from Bandle City, Yuumi was once the familiar of a yordle enchantress, Norra.',
		front_image_path: '/src/assets/cards/legendary/front/yuumi.webp',
		back_image_path: '/src/assets/cards/legendary/back/yuumi.webp',
		hero_link: 'https://www.leagueoflegends.com/en-us/champions/yuumi/'
	}
];

const gemSets = [
	{
		image_path: '',
		gem_amount: 5000,
		price: 0,
		available: true
	},
	{
		image_path: '',
		gem_amount: 5000,
		price: 0,
		available: true
	},
	{
		image_path: '',
		gem_amount: 5000,
		price: 0,
		available: true
	}
];

const insertData = async () => {
	try {
		const response = await fetch(
			`http://localhost:3001/api/${process.env.API_VERSION}/auth/signup`,
			{
				method: 'POST',
				headers: {
					'Content-type': 'application/json'
				},
				body: JSON.stringify({
					username: process.env.MAIN_ACC_NAME,
					password: process.env.MAIN_ACC_PWD,
					password_confirm: process.env.MAIN_ACC_PWD
				})
			}
		);

		const res = await response.json();

		if (res.status === 'success') {
			const userAcc = await User.findOne({ username: process.env.MAIN_ACC_NAME });

			if (userAcc.user_id) {
				const userId = userAcc.user_id;
				let cards = [];

				const saveCards = async (heroList, count) => {
					for (const hero of heroList) {
						const heroId = v4();
						const newHero = new Hero({
							hero_id: heroId,
							...hero
						});
						await newHero.save();

						for (let i = 0; i < count; i++) {
							const card_id = v4();
							const newCard = new Card({
								card_id,
								hero_id: heroId,
								in_sale: false,
								card_owner: {
									user_id: userId,
									username: process.env.MAIN_ACC_NAME
								},
								...hero
							});

							await newCard.save();
							cards.unshift(card_id);
						}
					}
					return heroList.length * count;
				};

				const rareCrds = await saveCards(rare, 300);
				const epicCards = await saveCards(epic, 100);
				const legendaryCards = await saveCards(legendary, 25);

				await Collection.updateOne(
					{ collection_id: userId },
					{
						$set: {
							cards: cards,
							rare_cards: rareCrds,
							epic_cards: epicCards,
							legendary_cards: legendaryCards
						}
					}
				);
			} else {
				console.log('No user found');
			}
		} else {
			console.error(res);
		}
	} catch (error) {
		console.error(error);
	}
};

const postTrade = async (card, access_token) => {
	let price = 0;

	if (card.rarity === 'Rare') {
		price = 400;
	} else if (card.rarity === 'Epic') {
		price = 1000;
	} else {
		price = 2500;
	}

	const response = await fetch(`http://localhost:3001/api/${process.env.API_VERSION}/trades`, {
		method: 'POST',
		headers: {
			'Content-type': 'application/json',
			Authorization: `Bearer ${access_token}`
		},
		body: JSON.stringify({
			trade: {
				give: [card.card_id],
				give_gems: false,
				take: price,
				take_gems: true,
				trade_accepter: {
					user_id: null,
					usename: null
				}
			}
		})
	});

	const res = await response.json();
	console.log(res.trade_id);
};

const makeInitTrades = async () => {
	console.log('Start to make trades');
	const tokenRes = await fetch(`http://localhost:3001/api/${process.env.API_VERSION}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-type': 'application/json'
		},
		body: JSON.stringify({
			username: process.env.MAIN_ACC_NAME,
			password: process.env.MAIN_ACC_PWD
		})
	});

	const { access_token } = await tokenRes.json();
	const collectionRes = await fetch(
		`http://localhost:3001/api/${process.env.API_VERSION}/collections/all/${process.env.MAIN_ACC_NAME}`
	);
	const resJSON = await collectionRes.json();
	const { cards } = resJSON.collection;

	await Promise.all(cards.map((card) => postTrade(card, access_token)));
};

const makeGemSets = async () => {};

const initApp = async () => {
	await insertData();
	await makeInitTrades();
	process.exit();
};

initApp();
