"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Label from "@/components/Label";
import InputError from "@/components/InputError";
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "@/lib/axios";

const RoomsPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const { birthcare_Id } = useParams();
  
  // State management
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    beds: "",
    price: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API Functions
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/birthcare/${birthcare_Id}/rooms`);
      if (response.data.success) {
        setRooms(response.data.data);
        setLoadingError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setLoadingError(error.response?.data?.message || error.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (roomData) => {
    try {
      const response = await axios.post(`/api/birthcare/${birthcare_Id}/rooms`, roomData);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create room');
      }
    } catch (error) {
      throw error;
    }
  };

  const updateRoom = async (roomId, roomData) => {
    try {
      const response = await axios.put(`/api/birthcare/${birthcare_Id}/rooms/${roomId}`, roomData);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update room');
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      const response = await axios.delete(`/api/birthcare/${birthcare_Id}/rooms/${roomId}`);
      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete room');
      }
    } catch (error) {
      throw error;
    }
  };

  // Load rooms on component mount
  useEffect(() => {
    if (user && birthcare_Id) {
      fetchRooms();
    }
  }, [user, birthcare_Id]);

  if (!user) {
    return null;
  }

  // Authorization check
  if (
    user.system_role_id !== 2 &&
    (user.system_role_id !== 3 ||
      !user.permissions?.includes("manage_rooms"))
  ) {
    return <div>Unauthorized</div>;
  }

  // Initialize form data when editing
  useEffect(() => {
    if (currentRoom) {
      setFormData({
        name: currentRoom.name || "",
        beds: currentRoom.bed_count?.toString() || "",
        price: currentRoom.price?.toString() || ""
      });
    } else {
      setFormData({
        name: "",
        beds: "",
        price: ""
      });
    }
  }, [currentRoom]);

  // Filter rooms based on search
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal handlers
  const openCreateModal = () => {
    setCurrentRoom(null);
    setIsEdit(false);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (room) => {
    setCurrentRoom(room);
    setIsEdit(true);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentRoom(null);
    setErrors({});
    document.body.style.overflow = 'unset';
  };
  
  // Delete modal handlers
  const openDeleteModal = (room) => {
    setCurrentRoom(room);
    setShowDeleteModal(true);
    document.body.style.overflow = 'hidden';
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentRoom(null);
    document.body.style.overflow = 'unset';
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Room name is required";
    }
    
    if (!formData.beds || formData.beds < 1) {
      newErrors.beds = "Number of beds must be at least 1";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const roomData = {
        name: formData.name.trim(),
        beds: parseInt(formData.beds),
        price: formData.price ? parseFloat(formData.price) : null
      };
      
      if (isEdit && currentRoom) {
        // Update existing room
        console.log('🔄 Updating room:', currentRoom.id, roomData);
        const updatedRoom = await updateRoom(currentRoom.id, roomData);
        
        // Update room in state
        setRooms(rooms.map(room => 
          room.id === currentRoom.id ? updatedRoom : room
        ));
        
        console.log('✅ Room updated successfully:', updatedRoom);
      } else {
        // Create new room
        console.log('✅ Creating new room:', roomData);
        const newRoom = await createRoom(roomData);
        
        // Add new room to state
        setRooms([...rooms, newRoom]);
        
        console.log('✅ Room created successfully:', newRoom);
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving room:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        setErrors(error.response.data.errors);
      } else {
        setErrors({ 
          submit: error.response?.data?.message || error.message || "Failed to save room. Please try again." 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!currentRoom) return;
    
    try {
      console.log('🗑️ Deleting room:', currentRoom.id);
      await deleteRoom(currentRoom.id);
      
      // Remove the room from state
      setRooms(rooms.filter(room => room.id !== currentRoom.id));
      
      console.log('✅ Room deleted successfully');
      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete room:", error);
      // You might want to show an error message to the user here
      alert(error.response?.data?.message || error.message || 'Failed to delete room');
    }
  };

  if (!user) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Effect to add/remove blur effect to entire app layout
  useEffect(() => {
    const appLayout = document.getElementById('app-layout');
    if ((showModal || showDeleteModal) && appLayout) {
      appLayout.style.filter = 'blur(4px)';
      appLayout.style.pointerEvents = 'none';
    } else if (appLayout) {
      appLayout.style.filter = 'none';
      appLayout.style.pointerEvents = 'auto';
    }
    return () => {
      if (appLayout) {
        appLayout.style.filter = 'none';
        appLayout.style.pointerEvents = 'auto';
      }
    };
  }, [showModal, showDeleteModal]);

  return (
    <>
      <div className="min-h-screen bg-[#F891A5]/20 rounded-2xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ROOM MANAGEMENT</h1>
              <p className="text-sm text-gray-600 mt-1">Manage rooms and bed availability</p>
            </div>
            <button
              onClick={openCreateModal}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#BF3853] to-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Room</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search rooms by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BF3853] focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#BF3853] font-medium">
              {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}
            </p>
          </div>

          {/* Rooms Grid/Table */}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
                <p className="mt-4 text-gray-700 font-semibold">Loading rooms...</p>
              </div>
            </div>
          ) : loadingError ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-600 mb-3">Error: {loadingError}</p>
                <button 
                  onClick={fetchRooms}
                  className="px-4 py-2 bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl text-sm font-medium text-white hover:shadow-lg hover:shadow-[#BF3853]/30 transition-all duration-200 hover:scale-105"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : filteredRooms.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white">
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">ROOM NAME</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">PRICE</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">BEDS</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">
                          {room.id}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">{room.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FDB3C2] text-[#A41F39]">
                            {room.price ? `₱${parseFloat(room.price).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#E56D85]/10 text-[#A41F39]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {room.bed_count || 0} {(room.bed_count || 0) === 1 ? 'bed' : 'beds'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEditModal(room)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Edit Room"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(room)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-lg hover:opacity-90 transition-opacity"
                              title="Delete Room"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-[#FDB3C2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#BF3853]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700">No Rooms Found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? 'No rooms match your search criteria.' : 'Add a new room to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Room Modal - Rendered outside app layout using portal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
          onClick={closeModal}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#BF3853] to-[#A41F39] text-white rounded-t-xl">
              <h3 className="text-xl font-semibold">
                {isEdit ? 'Edit Room' : 'Add New Room'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Room Name */}
                <div>
                  <Label htmlFor="name">Room Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full mt-1"
                    placeholder="e.g., Room 101"
                    disabled={isSubmitting}
                  />
                  {errors.name && <InputError message={errors.name} />}
                </div>

                {/* Number of Beds */}
                <div>
                  <Label htmlFor="beds">Number of Beds *</Label>
                  <Input
                    id="beds"
                    type="number"
                    min="1"
                    value={formData.beds}
                    onChange={(e) => setFormData({...formData, beds: e.target.value})}
                    className="w-full mt-1"
                    placeholder="e.g., 2"
                    disabled={isSubmitting}
                  />
                  {errors.beds && <InputError message={errors.beds} />}
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full mt-1"
                    placeholder="e.g., 1000.00"
                    disabled={isSubmitting}
                  />
                  {errors.price && <InputError message={errors.price} />}
                </div>

                {errors.submit && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                    {errors.submit}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-md hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      
      {/* Delete Confirmation Modal - Rendered outside app layout using portal */}
      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
          onClick={closeDeleteModal}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                Delete Room
              </h3>
              
              <p className="text-center text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{currentRoom?.name}</span>? 
                This will also delete all {currentRoom?.bed_count || 0} bed{(currentRoom?.bed_count || 0) === 1 ? '' : 's'} associated with this room.
                This action cannot be undone.
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl hover:shadow-lg hover:shadow-[#BF3853]/30 transition-all duration-200 hover:scale-105"
                >
                  Delete Room
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default RoomsPage;
