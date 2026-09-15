export interface GroupPhotoMember {
  name: string;
}

export interface GroupPhoto {
  id: string;
  name: string;
  type: string;
  avatarUrl: string;
  members: GroupPhotoMember[];
}

const GROUP_PHOTOS: Record<string, GroupPhoto> = {
  'romeo-juliet': {
    id: 'romeo-juliet',
    name: 'Romeo & Juliet',
    type: 'relationship',
    avatarUrl: '/assets/panda.jpg',
    members: [
      { name: 'Romeo Montague' },
      { name: 'Juliet Capulet' },
    ],
  },
};

export function getGroupPhoto(groupId: string): GroupPhoto | null {
  return GROUP_PHOTOS[groupId] ?? null;
}
