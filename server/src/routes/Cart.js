// src/routes/cart.js
import express from "express";
import Cart from "../models/Cart.js";
import Post from "../models/post.js";

const router = express.Router();

// Get cart for a user
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate(
      "items.product"
    );
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add item to cart
router.post("/add", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    const populatedCart = await cart.populate("items.product");
    res.json({ success: true, cart: populatedCart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update quantity
router.put("/update", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      const populatedCart = await cart.populate("items.product");
      return res.json({ success: true, cart: populatedCart });
    }

    res.status(404).json({ success: false, message: "Product not in cart" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove item
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    const populatedCart = await cart.populate("items.product");
    res.json({ success: true, cart: populatedCart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// src/routes/cart.js
router.delete("/clear", async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


export default router;
