/**
 * GroupPhoto Component
 * Displays group photos using binary image data
 */

import React, { useState, useEffect } from 'react';
import { getGroupPhoto } from '../data/group-photo';

interface GroupPhotoProps {
  groupId: string;
  size?: 'small' | 'medium' | 'large';
  showMembers?: boolean;
}

export const GroupPhoto: React.FC<GroupPhotoProps> = ({
  groupId,
  size = 'medium',
  showMembers = true
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const groupPhoto = getGroupPhoto(groupId);
      if (!groupPhoto) {
        setError('Group not found');
        setLoading(false);
        return;
      }

      // Use the binary data URL directly
      setImageUrl(groupPhoto.avatarUrl);
      setLoading(false);
    } catch (err) {
      setError('Failed to load group photo');
      setLoading(false);
    }
  }, [groupId]);

  const sizeClasses = {
    small: 'max-w-xs',
    medium: 'max-w-2xl',
    large: 'max-w-5xl'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const groupPhoto = getGroupPhoto(groupId)!;

  return (
    <div className={`group-photo-container ${sizeClasses[size]}`}>
      <div className="w-full overflow-hidden rounded-lg">
        <img
          src={imageUrl}
          alt={`${groupPhoto.name} group photo`}
          className="w-full h-auto object-cover"
          onError={() => setError('Failed to load image')}
        />
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-xl font-bold">{groupPhoto.name}</h3>
          <p className="text-sm text-gray-600">Relationship</p>
        </div>

        {showMembers && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Members:</p>
            <div className="flex flex-wrap gap-2">
              {groupPhoto.members.map((member, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {member.name}
                  {idx < groupPhoto.members.length - 1 && (
                    <span className="ml-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupPhoto;
