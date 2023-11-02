const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const checkToken = require('./config/check-token-middleware');
const path = require('path');
require('dotenv').config();
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('assets'));
app.use(cookieParser());
app.use(
  session({
    name: 'Session',
    secret: 'Jasmin',
    resave: true,
    saveUninitialized: false,
  })
);
const passportLocal = require('./config/passport_local_strategy');
const passportLocalUser = require('./config/passport_local_strategy_user');
const IcoStoDataMiddleware = require('./config/IcoStoData');
app.use(IcoStoDataMiddleware);
const fetchWebSettingMiddleware = require('./config/fetchWebSetting');
app.use(fetchWebSettingMiddleware);
app.use(passport.initialize());
app.use(passport.session());
const flash = require('connect-flash');
var custom = require('./config/middleware');
app.use(flash());
app.use(custom.setFlash);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const db = require('./config/mongoose');
app.use((req, res, next) => {
  if (req.isAuthenticated()) { 
    res.locals.user = req.user;
  }
  next();
});
app.use('/', require('./routes/userRoutes'));
app.use('/Admin', require('./routes/Admin/AdminRoutes'));
app.use('/kyc', require('./routes/KycRoutes'));
app.use('/auth', require('./routes/authRoutes'));

// API

app.use('/api/auth', require('./routes/API/Auth'));
// app.use('/api/kyc', require('./routes/API/kyc'));
app.use('/api/kyc',checkToken, require('./routes/API/kyc'));
app.use('/api/user',checkToken, require('./routes/API/user'));

// API End

const PORT = process.env.PORT;
app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server is running on port ${PORT}`);
}); 