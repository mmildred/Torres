export const toJSON = {
  transform(doc, ret){
    ret.id = ret._id?.toString?.();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
};
