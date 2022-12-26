const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateToken } = require("../verifyToken");

//Register Account:
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(req.body.password, salt);
      const newUser = await new User({
        name,
        email,
        password: hashedPass,
      });
      const user = await newUser.save();
      return res.status(201).json(user);
    } else {
      return res.status(404).json("User already exists");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

//Login:
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json("Wrong credentials");
    } else {
      const validPassword = await bcrypt.compareSync(
        password,
        existingUser.password
      );

      if (!validPassword) {
        return res.status(400).json("Wrong credentials");
      }

      const token = await jwt.sign(
        { email: existingUser.email },
        process.env.PRIVATE_KEY,
        { expiresIn: "2d" }
      );

      existingUser.token = token;
      existingUser.markModified("token");
      existingUser.save();
      return res.status(200).json(existingUser);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

// get users;

router.get("/", validateToken, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).populate("orders");
    res.json(users);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// get user orders

router.get("/:id/orders", validateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate("orders").sort({ date: -1 });
    res.json(user.orders);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// update user notifcations
router.post("/:id/updateNotifications", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    user.notifications.forEach((notif) => {
      notif.status = "read";
    });
    user.markModified("notifications");
    await user.save();
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = router;
