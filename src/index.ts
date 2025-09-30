import express, {  } from "express";
import trackTransactionRouter from "@/route/trackTransaction";

const app = express();

app.use("/transaction", trackTransactionRouter);
app.get("/", (req, res) => {
    res.send("Hello World");
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`Server listening on ${port}`);
});