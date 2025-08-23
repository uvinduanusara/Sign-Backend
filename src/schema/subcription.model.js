import mongoose from "mongoose";

const subcriptionSchema = new mongoose.Schema({
    subcriptionSchemaId: {
        type: String,
        required: true,
        unique: true,
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    isActive:{
        type: Boolean,
        default: false
    }
});

const Subcription = mongoose.model("Subcription", subcriptionSchema);

export default Subcription;
