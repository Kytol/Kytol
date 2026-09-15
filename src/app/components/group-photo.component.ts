import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonImg, IonBadge } from '@ionic/angular/standalone';
import { getGroupPhoto, GroupPhoto } from '../data/group-photo';

@Component({
  selector: 'app-group-photo',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonImg, IonBadge],
  template: `
    <ion-card *ngIf="groupPhoto && imageUrl" class="group-photo-card" [ngClass]="'size-' + size">
      <img [src]="imageUrl" [alt]="groupPhoto.name + ' group photo'" class="group-photo-image" />
      
      <ion-card-header>
        <ion-card-title>{{ groupPhoto.name }}</ion-card-title>
        <ion-card-subtitle>{{ groupPhoto.type | titlecase }}</ion-card-subtitle>
      </ion-card-header>

      <ion-card-content *ngIf="showMembers">
        <div class="members-section">
          <p class="members-label">Members:</p>
          <div class="members-list">
            <ion-badge *ngFor="let member of groupPhoto.members" color="primary">
              {{ member.name }}
            </ion-badge>
          </div>
        </div>
      </ion-card-content>
    </ion-card>

    <ion-card *ngIf="error" class="error-card">
      <ion-card-content>
        <p class="error-message">{{ error }}</p>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .group-photo-card {
      margin: 16px 0;
      border-radius: 12px;
      overflow: hidden;
    }

    .group-photo-card.size-small {
      max-width: 120px;
    }

    .group-photo-card.size-medium {
      max-width: 300px;
    }

    .group-photo-card.size-large {
      max-width: 100%;
    }

    .group-photo-image {
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      display: block;
    }

    ion-card-title {
      font-weight: 600;
      font-size: 18px;
    }

    ion-card-subtitle {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .members-section {
      margin-top: 12px;
    }

    .members-label {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .members-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    ion-badge {
      padding: 6px 12px;
    }

    .error-card {
      border: 1px solid var(--ion-color-danger);
      background: rgba(197, 0, 15, 0.1);
    }

    .error-message {
      color: var(--ion-color-danger);
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class GroupPhotoComponent implements OnInit {
  @Input() groupId: string = 'romeo-juliet';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showMembers: boolean = true;

  groupPhoto: GroupPhoto | null = null;
  imageUrl: string | null = null;
  error: string | null = null;

  ngOnInit() {
    this.loadGroupPhoto();
  }

  private loadGroupPhoto() {
    try {
      this.groupPhoto = getGroupPhoto(this.groupId);
      
      if (!this.groupPhoto) {
        this.error = 'Group not found';
        return;
      }

      // Use the binary data URL directly
      this.imageUrl = this.groupPhoto.avatarUrl;
    } catch (err) {
      this.error = 'Failed to load group photo';
      console.error(err);
    }
  }
}
