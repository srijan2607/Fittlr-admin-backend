const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../../errors/index');
const prisma = require('../../db/connect');

// Get all posts
const getAllPosts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const posts = await prisma.post.findMany({
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            googleId: true,
            name: true,
            profileImg: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const totalPosts = await prisma.post.count();
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    res.status(StatusCodes.OK).json({
      posts,
      currentPage: parseInt(page),
      totalPages,
      totalPosts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Delete a post by ID
const deletePostByAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

module.exports = {
  getAllPosts,
  deletePostByAdmin,
};
