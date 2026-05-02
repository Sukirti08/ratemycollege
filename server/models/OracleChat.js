const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const oracleChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    messages: [messageSchema],
    messageCount: {
      type: Number,
      default: 0,
    },
    isGuest: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


oracleChatSchema.index({ user: 1 });

module.exports = mongoose.model('OracleChat', oracleChatSchema);
