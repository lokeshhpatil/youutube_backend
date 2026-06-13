import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //the one who is going to subscribe;
      ref: 'User',
    },
    channel: {
      type: Schema.Types.ObjectId, // to whom user will subscribe (channel)
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const subscription = mongoose.model('subscription', subscriptionSchema);
