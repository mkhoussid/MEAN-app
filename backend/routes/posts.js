const express = require('express');

const router = express.Router();

const Post = require('../models/post');
const checkAuth = require('../middleware/check-auth');
const multer = require('multer');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error('Invalid MIME type');
    if (isValid) {
      error = null;
    }
    cb(error, 'backend/images');
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(' ')
      .join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});

router.post(
  '',
  checkAuth,
  multer({ storage: storage }).single('image'),
  (req, res, next) => {
    const url = req.protocol + '://' + req.get('host');
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imagePath: url + '/images/' + req.file.filename,
      creator: req.userData.userId
    });
    post.save().then(createdPost => {
      res.status(201).json({
        message: 'Post added successfully',
        post: {
          id: createdPost._id,
          title: createdPost.title,
          content: createdPost.content,
          imagePath: createdPost.imagePath

          /*
            or you could always do,
            post: {
              ...createdPost,
              id: createdPost._id,
          */
        }
      });
    });
  }
);

//put or patch
router.put(
  '/:id',
  checkAuth,
  multer({ storage: storage }).single('image'),
  (req, res, next) => {
    let imagePath = req.body.imagePath;
    if (req.file) {
      const url = req.protocol + '://' + req.get('host');
      imagePath = url + '/images/' + req.file.filename;
    }
    const post = new Post({
      _id: req.body.id,
      title: req.body.title,
      content: req.body.content,
      imagePath: imagePath
    });
    Post.updateOne(
      { _id: req.params.id, createdPost: req.userData.userId },
      post
    ).then(result => {
      if (result.n > 0) {
        res
          .status(200)
          .json({ message: `Successfully updated ${req.params.id}` });
      } else {
        res.status(401).json({ message: `Failed to update ${req.params.id}` });
      }
    });
  }
);

router.get('', (req, res, next) => {
  const pageSize = +req.query.pagesize; //params are strings by default, we need numeric values, so add '+'
  const currentPage = +req.query.page;
  const postQuery = Post.find();
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }
  postQuery
    .then(documents => {
      fetchedPosts = documents;
      return Post.count();
    })
    .then(count => {
      res.status(200).json({
        message: 'Posts fetched successfully',
        posts: fetchedPosts, //you can do res.map() because mongodb has '__id', but our structure has 'id'
        maxPosts: count //send this to front end so pagination knows
      });
    });
});

router.get('/:id', (req, res, next) => {
  Post.findById(req.params.id).then(post => {
    if (post) {
      res.status(200).json(post);
    } else {
      res
        .status(404)
        .json({ message: `Post with ID: ${req.params.id} not found!` });
    }
  });
});

router.delete('/:id', checkAuth, (req, res, next) => {
  Post.deleteOne({ _id: req.params.id, creator: req.userData.userId }).then(
    result => {
      if (result.n > 0) {
        res
          .status(200)
          .json({ message: `Post with ID: ${req.params.id} deleted!` });
      } else {
        res.status(401).json({
          message: `Failed to delete Post with ID: ${req.params.id}!`
        });
      }
    }
  );
});

module.exports = router;
