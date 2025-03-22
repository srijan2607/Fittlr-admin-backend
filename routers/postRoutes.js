const express = require('express');
const { getAllPosts, deletePostByAdmin } = require('../Controllers/community/postController');
// const authenticateAdmin = require('../middleware/authentication');

const router = express.Router();

// router.use(authenticateAdmin); // Middleware to authenticate admin

// Route to get all posts
router.get('/posts', getAllPosts);

// Route to delete a post by ID
router.delete('/posts/:id', deletePostByAdmin);

module.exports = router;
