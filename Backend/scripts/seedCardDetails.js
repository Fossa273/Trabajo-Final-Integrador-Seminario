import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

function uploadExists(imageUrl) {
  if (!imageUrl || !String(imageUrl).startsWith('/uploads/')) return true;
  return fs.existsSync(path.join(uploadsDir, path.basename(imageUrl)));
}

const CARD_DETAILS = [
  {
    menuStage: 'Stylo Clásico',
    detail: 'Ideal para eventos cálidos, familiares y divertidos.',
    budget: 85000.0,
    imageUrl: '/uploads/1788543505094-26921509.jpeg',
    starter:
      'Picada de fiambres artesanales de la región con selección de quesos duros y blandos, pan de campo y dips caseros.',
    mainCourse:
      'Pollo relleno de jamón, queso y morrón acompañado de puré rústico o papas españolas.',
    dessert:
      'Clásico brownie tibio de chocolate amargo coronado con bocha de helado de americana y hilos de frutos rojos.',
  },
  {
    menuStage: 'Stylo Elegante',
    detail: 'Perfecto para bodas de noche o eventos formales.',
    budget: 120000.0,
    imageUrl: '/uploads/1789046958325-822461417.jpeg',
    starter:
      'Bruschettas de pan de masa madre con salmón ahumado, queso crema alimonado y alcaparras.',
    mainCourse:
      'Sorrentinos caseros de calabaza y mozzarella con una sutil salsa de crema al verdeo y crocante de almendras tostadas.',
    dessert:
      'Copa helada de autor con capas de helado de maracuyá, crumble crujiente de almendras y reducción de frutos tropicales.',
  },
  {
    menuStage: 'Stylo Fest',
    detail:
      'Pensado especialmente para fiestas de 15 o celebraciones juveniles.',
    budget: 95000.0,
    imageUrl: '/uploads/1789046976782-978557305.jpeg',
    starter:
      'Cazuelitas de rabas crocantes con rodajas de limón y emulsión de alioli suave.',
    mainCourse:
      'Milanesa napolitana individual de ternera acompañada de una torre de papas fritas rústicas doradas al horno.',
    dessert:
      'Bombón suizo bañado en chocolate semiamargo con corazón de dulce de leche granizado y lluvia de nueces.',
  },
  {
    menuStage: 'Stylo Infantil',
    detail: 'Menú pensado para cumpleaños infantiles y eventos familiares.',
    budget: 70000.0,
    imageUrl: '/uploads/1788543505094-26921509.jpeg',
    starter:
      'Bastones de muzzarella con salsa de tomate casera y mini empanaditas de jamón y queso.',
    mainCourse:
      'Hamburguesas caseras con pan artesanal, papas fritas y aderezos a elección.',
    dessert:
      'Copa de helado con toppings de chocolate, dulce de leche y galletitas trituradas.',
  },
  {
    menuStage: 'Stylo Vegetariano',
    detail:
      'Propuesta completa sin carnes, ideal para invitados con dietas especiales.',
    budget: 105000.0,
    imageUrl: '/uploads/1789046958325-822461417.jpeg',
    starter:
      'Tartar de palta y tomate con crocantes de quinoa y vinagreta de limón.',
    mainCourse:
      'Lasagna de calabaza, espinaca y ricota con salsa de tomates asados y albahaca fresca.',
    dessert:
      'Cheesecake de frutos rojos con base de galletitas y crema de castañas.',
  },
  {
    menuStage: 'Stylo Gourmet',
    detail:
      'Experiencia de autor con productos premium y presentación de alta cocina.',
    budget: 160000.0,
    imageUrl: '/uploads/1789046976782-978557305.jpeg',
    starter: 'Carpaccio de ternera con rúcula, parmesano y alioli de trufa.',
    mainCourse:
      'Ojo de bife madurado con papas confitadas, cebollas caramelizadas y salsa de vino malbec.',
    dessert:
      'Esfera de chocolate rellena de mousse de frambuesa con helado de vainilla bourbon.',
  },
];

async function seed() {
  let inserted = 0;
  let skipped = 0;
  let repairedImages = 0;
  let repairedTexts = 0;

  for (const card of CARD_DETAILS) {
    const existing = await prisma.cardDetail.findFirst({
      where: { menuStage: card.menuStage },
    });

    if (existing) {
      const imageNeedsRepair =
        !uploadExists(existing.imageUrl) && uploadExists(card.imageUrl);
      const textNeedsRepair =
        existing.detail !== card.detail ||
        existing.starter !== card.starter ||
        existing.mainCourse !== card.mainCourse ||
        existing.dessert !== card.dessert;

      if (imageNeedsRepair || textNeedsRepair) {
        await prisma.cardDetail.update({
          where: { idCardDetail: existing.idCardDetail },
          data: {
            detail: card.detail,
            starter: card.starter,
            mainCourse: card.mainCourse,
            dessert: card.dessert,
            ...(imageNeedsRepair ? { imageUrl: card.imageUrl } : {}),
          },
        });

        if (imageNeedsRepair) repairedImages++;
        if (textNeedsRepair) repairedTexts++;
      } else {
        skipped++;
      }
      continue;
    }

    await prisma.cardDetail.create({
      data: {
        menuStage: card.menuStage,
        detail: card.detail,
        budget: card.budget,
        imageUrl: card.imageUrl,
        starter: card.starter,
        mainCourse: card.mainCourse,
        dessert: card.dessert,
      },
    });
    inserted++;
  }

  console.log(
    `Seed de menús finalizado: ${inserted} insertados, ${skipped} omitidos (ya existían), ${repairedImages} imágenes reparadas, ${repairedTexts} textos corregidos.`,
  );

  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Error al sembrar menús:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
