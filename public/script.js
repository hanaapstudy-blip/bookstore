document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication Check
    try {
        const authRes = await fetch('/api/me');
        const authData = await authRes.json();
        
        if (!authData.authenticated) {
            window.location.href = '/login.html';
            return;
        }

        // Setup User Greeting
        document.getElementById('user-greeting').textContent = `Welcome, ${authData.username}`;
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.style.display = 'inline-block';
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login.html';
        });

    } catch (err) {
        console.error('Auth check failed:', err);
    }

    // 2. Fetch Book Data
    let bookPriceBase = 0;
    try {
        const res = await fetch('/api/book');
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        const book = await res.json();
        
        // Populate UI
        document.getElementById('book-title').textContent = book.title;
        document.getElementById('book-author').textContent = book.author;
        document.getElementById('book-description').textContent = book.description;
        document.getElementById('book-image').src = book.imageUrl;
        
        bookPriceBase = book.price;
        document.getElementById('book-price').textContent = `$${book.price.toFixed(2)}`;

        const featuresContainer = document.getElementById('book-features');
        book.features.forEach(f => {
            const div = document.createElement('div');
            div.className = 'feature-item';
            div.innerHTML = `<span class="feature-icon">${f.icon}</span><span class="feature-text">${f.text}</span>`;
            featuresContainer.appendChild(div);
        });

        const formatsContainer = document.getElementById('book-formats');
        book.formats.forEach((f, idx) => {
            const btn = document.createElement('button');
            btn.className = `format-btn ${idx === 0 ? 'active' : ''}`;
            btn.dataset.price = f.priceAddition;
            btn.innerHTML = `<strong>${f.name}</strong><span>+ $${f.priceAddition.toFixed(2)}</span>`;
            formatsContainer.appendChild(btn);

            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const newPrice = bookPriceBase + f.priceAddition;
                document.getElementById('book-price').textContent = `$${newPrice.toFixed(2)}`;
            });
        });

        document.getElementById('book-content').style.opacity = '1';

    } catch (err) {
        console.error('Failed to load book data:', err);
    }

    // 3. User Interactivity (Cart)
    const addToCartBtn = document.getElementById('addToCartBtn');
    const cartCount = document.querySelector('.cart-count');
    const toastMessage = document.getElementById('toastMessage');

    let count = 0;
    addToCartBtn.addEventListener('click', () => {
        count++;
        cartCount.style.transform = 'translate(25%, -25%) scale(1.5)';
        cartCount.textContent = count;
        setTimeout(() => { cartCount.style.transform = 'translate(25%, -25%) scale(1)'; }, 200);

        toastMessage.classList.add('show');
        setTimeout(() => { toastMessage.classList.remove('show'); }, 3000);
        
        addToCartBtn.style.transform = 'scale(0.95)';
        setTimeout(() => { addToCartBtn.style.transform = 'translateY(-3px)'; }, 150);
    });
});
