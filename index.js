const express = require("express");
const knex = require("./db/knex");
const PORT = 5000;
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const routerV1 = require("./routes/v1/index");
const app = express();
const path = require("path");

const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

// Enable CORS for all routes
app.use(cors());

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/doc", swaggerUI.serve, swaggerUI.setup(swaggerFile));

app.get("/ping", (req, res) => {
  res.send({
    error: false,
    message: "Server is healthy",
  });
});
app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("Hello World!");
});
app.get("/test", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/uji1", (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        nim: "202021420022",
        nama: "Habibul",
        prodi: "Teknik Informatika",
        fakultas: "Teknik",
        noTelp: "081234567890",
        alamat: "SURABAYA",
      },
    ],
  });
});

app.use(morgan("tiny"));
// parsing the request bodys
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);
// inisialisasi router
app.use("/v1/", routerV1);

app.listen(PORT, () => {
  knex
    .raw("select 1=1 as test")
    .then((result) => {
      console.log("DB CONNECTION: ", result.rows[0].test);
    })
    .catch((err) => {
      console.log("ERROR DB:", err);
    });
  console.log("Server started listening on PORT : " + PORT);
});
