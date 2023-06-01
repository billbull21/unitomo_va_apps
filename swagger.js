const swaggerAutogen = require("swagger-autogen")();
const outputFile = "./swagger_output.json";
const endpointsFiles = ["./routes/v1/index.js"]; // root file dimana router dijalankan.
const doc = {
  info: {
    title: "Praktikum BE API",
    description: "Ini adalah Endpoint dari Praktikum BackEnd",
  },
  host: "localhost:5000",
  basePath: "/v1",
  schemes: ["http"],
  definitions: {
    UserRequestFormat: {
      $nama: "",
      $username: "",
      $email: "",
      $telp: "",
      $password: "",
    },
    LoginRequestFormat: {
      $identity: "",
      $password: "",
    },
  },
};
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index.js"); // Your project's root file
});
