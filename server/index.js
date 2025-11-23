const express = require('express');
const { connectionToDB } = require('./src/config/dbConfig');
const userRouter = require('./src/routes/userRoutes');
let app= express()
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "hello world" });
});
app.use('/api',userRouter)

app.listen(process.env.PORT, async () => {
  try {
    console.log(`Server is running on port ${process.env.PORT}`);
    await connectionToDB();
  } catch (err) {
    console.log(err);
  }
});