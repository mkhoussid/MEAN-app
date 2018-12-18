import { Component } from '@angular/core';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent {
  post = [
    { title: 'First Post', content: 'This is the first (1st) post' },
    { title: 'Second Post', content: 'This is the second (2nd) post' },
    { title: 'Third Post', content: 'This is the third (3rd) post' }
  ];
}