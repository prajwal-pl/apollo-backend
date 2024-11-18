import { PrismaClient } from "@prisma/client";
import { products } from "./seed/coffee-data.json";

const prisma = new PrismaClient();

async function main() {
  // Clean the existing database
  await prisma.product.deleteMany({});

  // Seed the database with products
  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image_url: product.image_url,
        rating: product.rating,
      },
    });
  }

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
