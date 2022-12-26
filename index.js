const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const stripe = require("stripe")(
  "sk_test_51LVJMlSBYoi60USZGetxUqucqLC2uS9jdN14mQrALTyCtLnR3IYgBffgBFsVh2qfMXHPF8Q2DW3pYjVEMHKzYpBy00gqfwOsbn"
);
const http = require("http");
const { Server } = require("socket.io");
const { default: mongoose } = require("mongoose");
const userRouter = require("./routes/userRouter");
const imagesRouter = require("./routes/imagesRouter");
const ordersRouter = require("./routes/ordersRouter");
const productRouter = require("./routes/productRouter");
const { validateToken } = require("./verifyToken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "DELETE"],
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    origin: new URL("http://localhost:3000"),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.get("/", (req, res) => res.send("Hi and Welcome"));
app.use("/users", userRouter);
app.use("/images", imagesRouter);
app.use("/orders", ordersRouter);
app.use("/products", productRouter);

app.post("/create-payment", validateToken, async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      payment_method_types: ["card"],
    });
    res.status(200).json(paymentIntent);
  } catch (e) {
    console.log(e.message);
    res.status(400).json(e.message);
  }
});

mongoose.connect(`${process.env.MONGO_URL}`, { useNewUrlparser: true }, () =>
  console.log("Mongodb connected")
);
mongoose.connection.on("error", (err) => {
  console.log(err);
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
app.set("socketio", io);
