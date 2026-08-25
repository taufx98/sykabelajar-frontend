import { Navbar } from '../components/Navbar.js';

export function Layout(content) {
  return `
    ${Navbar()}
    <main class="sy-container">
      ${content}
    </main>
  `;
}
