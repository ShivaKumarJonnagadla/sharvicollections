/**
 * One-off: populate Swedish translations (nameSv/descriptionSv) for the initial
 * 12 products. Matched by slug. Safe to re-run. Run: npx tsx scripts/translate-products.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRANSLATIONS: Record<string, { nameSv: string; descriptionSv: string }> = {
  'multi-tone-hammered-statement-necklace-set': {
    nameSv: 'Flertonigt Hamrat Statementhalsband-set',
    descriptionSv:
      'Djärvt hamrat statementhalsband med matchande örhängen i roséguld-, champagne- och pärlvita toner. Ett slående västerländskt inspirerat set för speciella tillfällen.',
  },
  'antique-amethyst-and-cz-necklace-set': {
    nameSv: 'Antikt Ametist- & CZ-halsbandsset',
    descriptionSv:
      'Ståtligt antikguldhalsband och örhängen med mjuka ametiststenar inramade av gnistrande kubisk zirkonia. Indiskt inspirerat hantverk för festliga tillfällen.',
  },
  'antique-rose-floral-drop-earrings': {
    nameSv: 'Antika Rosa Blommiga Hängörhängen',
    descriptionSv:
      'Antikguldfärgade droppformade örhängen med delikat rosa blomsterarbete. Vintagecharm som lyfter etniska och fusion-looks.',
  },
  'ruby-and-gold-bead-chain-necklace': {
    nameSv: 'Rubin- & Guldpärlehalsband',
    descriptionSv:
      'Nätt guldfärgad kedja med rubinröda pärlor och filigranpärlor i guld, med matchande örhängen. Vardaglig elegans med en kulturell touch.',
  },
  'black-bead-cz-mangalsutra-chain': {
    nameSv: 'Svartpärlig CZ Mangalsutra-kedja',
    descriptionSv:
      'Delikat guldfärgad kedja med svarta pärlor och två kubisk zirkonia-pärlor. En modern, minimalistisk tolkning av den klassiska mangalsutran.',
  },
  'gold-heart-charm-necklace': {
    nameSv: 'Guldhalsband med Hjärtberlocker',
    descriptionSv:
      'Minimalistiskt guldfärgat halsband med en rad öppna hjärtberlocker. Lätt, sött och perfekt för vardagslagring.',
  },
  'black-bead-cz-chain-necklace': {
    nameSv: 'Svartpärligt CZ-kedjehalsband',
    descriptionSv:
      'Guldfärgad kedja med svarta pärldetaljer och kubisk zirkonia-accenter. Subtil glans för vardagsbruk.',
  },
  'cz-bow-pendant-black-bead-necklace': {
    nameSv: 'CZ Rosetthänge med Svarta Pärlor',
    descriptionSv:
      'Guldfärgat halsband med ett hänge i kubisk zirkonia format som en rosett och delikata svarta pärlstationer. Lekfullt men elegant.',
  },
  'tri-tone-heart-necklace-set': {
    nameSv: 'Tretonigt Hjärthalsband-set',
    descriptionSv:
      'Tretonigt emaljhjärthalsband med matchande örhängen, accentuerat med klara kristaller. Lekfull mångkulturell charm för vardagliga utflykter.',
  },
  'cubic-zirconia-line-drop-earrings': {
    nameSv: 'Kubisk Zirkonia Linjeörhängen',
    descriptionSv:
      'Långa hängande örhängen i kubisk zirkonia med en lyxig guldfärgad finish. Röda mattan-glans för speciella kvällar.',
  },
  'multicolour-cz-leaf-choker': {
    nameSv: 'Flerfärgad CZ Löv-choker',
    descriptionSv:
      'Nätt guldfärgad choker med flerfärgade kubisk zirkonia-infattningar och små lövberlocker. Fräsch, mångsidig och lätt.',
  },
  'gold-star-and-leaf-station-necklace': {
    nameSv: 'Guldhalsband med Stjärnor & Löv',
    descriptionSv:
      'Guldfärgat stationshalsband beströdd med stjärnor, löv och flerfärgade kubisk zirkonia-berlocker. Ett lekfullt vardagsstatement.',
  },
};

async function main() {
  let updated = 0;
  for (const [slug, tr] of Object.entries(TRANSLATIONS)) {
    const res = await prisma.product.updateMany({ where: { slug }, data: tr });
    if (res.count) updated += res.count;
  }
  console.log(`✔ Swedish translations applied to ${updated} products.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
