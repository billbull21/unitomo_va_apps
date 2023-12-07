require("dotenv").config();
const swaggerAutogen = require("swagger-autogen")();
const outputFile = "./swagger_output.json";
const endpointsFiles = ["./routes/v1/index.js"]; // root file dimana router dijalankan.
const { BASE_URL, SCHEME } = process.env;
const doc = {
  info: {
    title: "Unitomo VA Payment",
    description: "Ini adalah dokumentasi api untuk aplikasi VA Universitas Dr. Soetomo Fakultas Teknik",
  },
  host: `${BASE_URL}`,
  basePath: "/v1",
  schemes: [`${SCHEME}`],
  definitions: {
    UserRequestFormat: {
      $nim: "",
      $nama: "",
      $prodi: "",
      $no_hp: "",
      $email: "",
      $password: "",
    },
    UpdateUserRequestFormat: {
      $nim: "",
      $nama: "",
      $prodi: "",
      $no_hp: "",
      $email: "",
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
      $user_id: "input this if you are admin, if you aren't optional",
      $va: "",
      $va_name: "*optional",
      $payment_category: "",
      $nominal: 0,
      $parsial: false,
    },
    ForgotPasswordRequestFormat: {
      $email: "",
    },
    ResetPasswordRequestFormat: {
      $email: "",
      $otp: "",
      $password: "",
    },
  },
};
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index.js"); // Your project's root file
});
