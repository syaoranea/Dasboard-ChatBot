import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  @Input() type: 'spinner' | 'skeleton' | 'overlay' = 'spinner';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message: string = 'Carregando...';
  @Input() fullScreen: boolean = false;
}
