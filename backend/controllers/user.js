const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.createUser = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = new User({
      email: req.body.email,
      password: hash
    });
    user
      .save()
      .then(result => {
        res.status(201).json({
          message: `User with email ${req.body.email} created`,
          result: result
        });
      })
      .catch(err => {
        res.status(500).json({
          message: `Email ${req.body.email} already exists`,
          error: err
        });
      });
  });
};

exports.userLogin = (req, res, next) => {
  let _user;
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: `Email ${req.body.email} does not exist in system`
        });
      }
      _user = user;
      return bcrypt.compare(req.body.password, user.password); //compare return a promise
    })
    .then(result => {
      if (!result) {
        return res.status(401).json({
          message: `Incorrect password for ${req.body.email}`
        });
      }
      const token = jwt.sign(
        { email: _user.email, userId: _user._id },
        process.env.JWT_KEY,
        { expiresIn: '1h' }
      );
      res.status(200).json({
        message: `${_user.email} successfully logged in`,
        token: token,
        expiresIn: 3600,
        userId: _user._id
      });
    })
    .catch(err => {
      return res.status(401).json({
        message: 'Authentication failed',
        error: err
      });
    });
};
