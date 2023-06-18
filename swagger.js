const swaggerAutogen = require("swagger-autogen")();
const outputFile = "./swagger_output.json";
const endpointsFiles = ["./routes/v1/index.js"]; // root file dimana router dijalankan.
const doc = {
  info: {
    title: "Unitomo VA Payment",
    description: "Ini adalah dokumentasi api untuk aplikasi VA Universitas Dr. Soetomo Fakultas Teknik",
  },
  host: "localhost:5000",
  basePath: "/v1",
  schemes: ["http"],
  definitions: {
    UserRequestFormat: {
      $nim: "",
      $nama: "",
      $prodi: "",
      $no_hp: "",
      $email: "",
      $password: "",
    },
    LoginRequestFormat: {
      $nim: "",
      $password: "",
    },
    UpdatePasswordRequestFormat: {
      $password: "",
      $new_password: "",
    },
    VAHistoryRequestFormat: {
      $user_id: "",
      $va: "",
      $payment_category: "",
      $nominal: 0,
    },
    ForgotPasswordRequestFormat: {
      $email: "",
    },
    ResetPasswordRequestFormat: {
      $email: "",
      $password: "",
    },
  },
};
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index.js"); // Your project's root file
});
