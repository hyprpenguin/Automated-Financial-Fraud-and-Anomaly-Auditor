const express = require('express');

const mongoSanitize=require('express-mongo-sanitize');

let app = express();

app.use(express.json());
app.use(mongoSanitize());

app.listen(3000, () => {
  console.log('Server is running on Port 3000.');

});