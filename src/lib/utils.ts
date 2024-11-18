import { prisma } from "./db";

export const placeOrder = async (productId: string, quantity: number) => {
  if (!productId || !quantity) {
    throw new Error("Invalid parameters");
  }
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const total = product.price * quantity;

    console.log("Order function hit");

    const order = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        product: {
          connect: {
            id: productId,
          },
        },
        quantity,
        total,
      },
    });

    console.log(order);

    return order;
  } catch (error) {
    console.error(error);
  }
};
