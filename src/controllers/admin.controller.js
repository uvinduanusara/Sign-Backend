import User from "../schema/user.model.js";
import Learning from "../schema/learning.model.js";
import Practice from "../schema/practice.model.js";
import Role from "../schema/role.model.js";
import { deleteImageFile } from "../middleware/upload.middleware.js";
import path from "path";

// Dashboard Statistics
export async function getDashboardStats(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalLessons = await Learning.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalRoles = await Role.countDocuments();

    // Mock data for demo purposes
    const stats = {
      totalUsers,
      totalLessons,
      activeUsers,
      totalRoles,
      totalSubscriptions: Math.floor(totalUsers * 0.3), // Mock 30% subscription rate
      monthlyRevenue: Math.floor(Math.random() * 10000) + 5000,
      completedLessons: Math.floor(totalLessons * 0.6),
      averageProgress: Math.floor(Math.random() * 30) + 60
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch dashboard statistics" 
    });
  }
}

// User Management
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .populate('role', 'roleName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalUsers: total
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch users" 
    });
  }
}

export async function createUser(req, res) {
  try {
    const userData = req.body;
    
    // Convert role name to ObjectId
    const role = await Role.findOne({ roleName: userData.role });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: `Role '${userData.role}' not found`
      });
    }
    
    // Set default stripCustomerId for non-user roles
    const stripCustomerId = userData.role === 'user' ? 'pending' : 'not_applicable';
    
    const user = new User({
      ...userData,
      role: role._id,
      stripCustomerId
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully"
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create user" 
    });
  }
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('role', 'roleName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user,
      message: "User updated successfully"
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update user" 
    });
  }
}

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete user" 
    });
  }
}

// Learning Materials Management
export async function getAllMaterials(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.learnName = { $regex: search, $options: 'i' };
    }
    
    const materials = await Learning.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Learning.countDocuments(query);

    res.json({
      success: true,
      data: {
        materials,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalMaterials: total
      }
    });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch learning materials" 
    });
  }
}

export async function createMaterial(req, res) {
  console.log('=== createMaterial endpoint hit ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  try {
    const materialData = req.body;
    
    // Parse signs if it's a string
    if (typeof materialData.signs === 'string') {
      materialData.signs = materialData.signs.split(',').map(sign => sign.trim());
    }
    
    // Handle uploaded images
    const signImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Extract sign name from field name or use filename
        const signName = file.fieldname.replace('signImage_', '') || file.originalname.split('.')[0];
        signImages.push({
          signName: signName,
          imageUrl: `/uploads/learning-materials/${file.filename}`,
          filename: file.filename
        });
      });
    }
    
    const material = new Learning({
      ...materialData,
      signImages
    });
    
    await material.save();
    
    res.status(201).json({
      success: true,
      data: material,
      message: "Learning material created successfully"
    });
  } catch (error) {
    console.error("Create material error:", error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        deleteImageFile(file.filename);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to create learning material" 
    });
  }
}

export async function updateMaterial(req, res) {
  try {
    const { materialId } = req.params;
    const updateData = req.body;

    // Parse signs if it's a string
    if (typeof updateData.signs === 'string') {
      updateData.signs = updateData.signs.split(',').map(sign => sign.trim());
    }

    // Find existing material for image cleanup
    const existingMaterial = await Learning.findById(materialId);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: "Learning material not found"
      });
    }

    // Handle new uploaded images
    const newSignImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const signName = file.fieldname.replace('signImage_', '') || file.originalname.split('.')[0];
        newSignImages.push({
          signName: signName,
          imageUrl: `/uploads/learning-materials/${file.filename}`,
          filename: file.filename
        });
      });
    }

    // Parse existing images to keep (sent as JSON string)
    let existingImages = [];
    if (updateData.existingImages) {
      try {
        existingImages = JSON.parse(updateData.existingImages);
      } catch (e) {
        console.error('Error parsing existingImages:', e);
      }
    }

    // Delete images that are being removed
    const imagesToDelete = existingMaterial.signImages.filter(
      img => !existingImages.some(existing => existing.filename === img.filename)
    );
    
    imagesToDelete.forEach(img => {
      deleteImageFile(img.filename);
    });

    // Combine existing and new images
    const allImages = [...existingImages, ...newSignImages];

    const material = await Learning.findByIdAndUpdate(
      materialId,
      { ...updateData, signImages: allImages },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: material,
      message: "Learning material updated successfully"
    });
  } catch (error) {
    console.error("Update material error:", error);
    
    // Clean up new uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        deleteImageFile(file.filename);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to update learning material" 
    });
  }
}

export async function deleteMaterial(req, res) {
  try {
    const { materialId } = req.params;

    // Find material first to get image references
    const material = await Learning.findById(materialId);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Learning material not found"
      });
    }

    // Delete all associated images
    if (material.signImages && material.signImages.length > 0) {
      material.signImages.forEach(image => {
        deleteImageFile(image.filename);
      });
    }

    // Delete the material from database
    await Learning.findByIdAndDelete(materialId);

    res.json({
      success: true,
      message: "Learning material deleted successfully"
    });
  } catch (error) {
    console.error("Delete material error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete learning material" 
    });
  }
}

// Reviews Management (Mock implementation)
export async function getAllReviews(req, res) {
  try {
    // Mock reviews data since there's no reviews model
    const mockReviews = [
      {
        id: '1',
        userId: 'user1',
        userName: 'John Doe',
        rating: 5,
        comment: 'Great learning experience!',
        lessonId: 'lesson-001',
        lessonName: 'Basic Greetings',
        status: 'approved',
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Jane Smith',
        rating: 4,
        comment: 'Very helpful for beginners.',
        lessonId: 'lesson-002',
        lessonName: 'Alphabet A-M',
        status: 'pending',
        createdAt: new Date('2024-01-14')
      }
    ];

    res.json({
      success: true,
      data: {
        reviews: mockReviews,
        totalPages: 1,
        currentPage: 1,
        totalReviews: mockReviews.length
      }
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reviews" 
    });
  }
}

export async function updateReviewStatus(req, res) {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    // Mock implementation
    res.json({
      success: true,
      message: `Review ${reviewId} status updated to ${status}`
    });
  } catch (error) {
    console.error("Update review status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update review status" 
    });
  }
}

export async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    // Mock implementation
    res.json({
      success: true,
      message: `Review ${reviewId} deleted successfully`
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete review" 
    });
  }
}

// Role Management
export async function getAllRoles(req, res) {
  try {
    const roles = await Role.find();
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch roles" 
    });
  }
}

// Practice Materials Management
export async function getAllPracticeMaterials(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.practiceName = { $regex: search, $options: 'i' };
    }
    
    const materials = await Practice.find(query)
      .populate('createdBy', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Practice.countDocuments(query);

    res.json({
      success: true,
      data: {
        materials,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalMaterials: total
      }
    });
  } catch (error) {
    console.error("Get practice materials error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch practice materials" 
    });
  }
}

export async function createPracticeMaterial(req, res) {
  console.log('=== createPracticeMaterial endpoint hit ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  try {
    const materialData = req.body;
    
    // Parse signs if it's a string
    if (typeof materialData.signs === 'string') {
      materialData.signs = materialData.signs.split(',').map(sign => sign.trim());
    }
    
    // Handle uploaded images
    const signImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Extract sign name from field name or use filename
        const signName = file.fieldname.replace('signImage_', '') || file.originalname.split('.')[0];
        signImages.push({
          signName: signName,
          imageUrl: `/uploads/learning-materials/${file.filename}`,
          filename: file.filename
        });
      });
    }
    
    const material = new Practice({
      ...materialData,
      signImages,
      createdBy: req.user.id
    });
    
    await material.save();
    
    res.status(201).json({
      success: true,
      data: material,
      message: "Practice material created successfully"
    });
  } catch (error) {
    console.error("Create practice material error:", error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        deleteImageFile(file.filename);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to create practice material" 
    });
  }
}

export async function updatePracticeMaterial(req, res) {
  try {
    const { materialId } = req.params;
    const updateData = req.body;

    // Parse signs if it's a string
    if (typeof updateData.signs === 'string') {
      updateData.signs = updateData.signs.split(',').map(sign => sign.trim());
    }

    // Find existing material for image cleanup
    const existingMaterial = await Practice.findById(materialId);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: "Practice material not found"
      });
    }

    // Handle new uploaded images
    const newSignImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const signName = file.fieldname.replace('signImage_', '') || file.originalname.split('.')[0];
        newSignImages.push({
          signName: signName,
          imageUrl: `/uploads/learning-materials/${file.filename}`,
          filename: file.filename
        });
      });
    }

    // Parse existing images to keep (sent as JSON string)
    let existingImages = [];
    if (updateData.existingImages) {
      try {
        existingImages = JSON.parse(updateData.existingImages);
      } catch (e) {
        console.error('Error parsing existingImages:', e);
      }
    }

    // Delete images that are being removed
    const imagesToDelete = existingMaterial.signImages.filter(
      img => !existingImages.some(existing => existing.filename === img.filename)
    );
    
    imagesToDelete.forEach(img => {
      deleteImageFile(img.filename);
    });

    // Combine existing and new images
    const allImages = [...existingImages, ...newSignImages];

    const material = await Practice.findByIdAndUpdate(
      materialId,
      { ...updateData, signImages: allImages },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: material,
      message: "Practice material updated successfully"
    });
  } catch (error) {
    console.error("Update practice material error:", error);
    
    // Clean up new uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        deleteImageFile(file.filename);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to update practice material" 
    });
  }
}

export async function deletePracticeMaterial(req, res) {
  try {
    const { materialId } = req.params;

    // Find material first to get image references
    const material = await Practice.findById(materialId);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Practice material not found"
      });
    }

    // Delete all associated images
    if (material.signImages && material.signImages.length > 0) {
      material.signImages.forEach(image => {
        deleteImageFile(image.filename);
      });
    }

    // Delete the material from database
    await Practice.findByIdAndDelete(materialId);

    res.json({
      success: true,
      message: "Practice material deleted successfully"
    });
  } catch (error) {
    console.error("Delete practice material error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete practice material" 
    });
  }
}

// Pro Member Management
export async function updateProMemberStatus(req, res) {
  try {
    const { userId } = req.params;
    const { isProMember, membershipDuration = 30 } = req.body;

    let updateData = { isProMember };
    
    if (isProMember) {
      // Set expiry date based on membership duration (in days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + membershipDuration);
      updateData.proMembershipExpiry = expiryDate;
    } else {
      updateData.proMembershipExpiry = null;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('role', 'roleName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user,
      message: `User ${isProMember ? 'granted' : 'revoked'} pro membership successfully`
    });
  } catch (error) {
    console.error("Update pro member status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update pro member status" 
    });
  }
}

export async function getProMembers(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const proMembers = await User.find({ isProMember: true })
      .populate('role', 'roleName')
      .sort({ proMembershipExpiry: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({ isProMember: true });
    const expired = await User.countDocuments({ 
      isProMember: true, 
      proMembershipExpiry: { $lt: new Date() } 
    });

    res.json({
      success: true,
      data: {
        proMembers,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        },
        stats: {
          totalProMembers: total,
          expiredMemberships: expired
        }
      }
    });
  } catch (error) {
    console.error("Get pro members error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch pro members" 
    });
  }
}