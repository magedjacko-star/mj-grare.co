(function(){
  const $ = (id) => document.getElementById(id);

  const newsGrid = $("newsGrid");
  const adminBar = $("adminBar");
  const modal = $("modal");
  const addBtn = $("addBtn");
  const clearBtn = $("clearBtn");
  const closeModal = $("closeModal");
  const cancelBtn = $("cancelBtn");
  const form = $("newsForm");

  const LS_KEY = "mj_news_items";
  const LS_ADMIN = "mj_admin_mode";

  function loadItems(){
    const saved = localStorage.getItem(LS_KEY);
    if(saved){
      try { return JSON.parse(saved) || []; } catch(e){ return []; }
    }
    const seed = Array.isArray(window.NEWS_SEED) ? window.NEWS_SEED : [];
    // اعمل _id لكل عنصر seed لو مش موجود
    const seeded = seed.map(x => ({ _id: x._id || (String(Date.now()) + Math.random().toString(16).slice(2)), ...x }));
    localStorage.setItem(LS_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function saveItems(items){
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function isAdmin(){
    const urlAdmin = new URLSearchParams(location.search).get("admin") === "1";
    const stored = localStorage.getItem(LS_ADMIN) === "1";
    return urlAdmin || stored;
  }

  function setAdmin(on){
    localStorage.setItem(LS_ADMIN, on ? "1" : "0");
    adminBar.style.display = on ? "flex" : "none";
    render();
  }

  function openModal(){
    modal.classList.add("open");
  }
  function closeModalFn(){
    modal.classList.remove("open");
    form.reset();
  }

  function escapeHtml(s){
    return (s||"").replace(/[&<>"']/g, (c)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function cardTpl(item){
    const title = escapeHtml(item.title);
    const cat = escapeHtml(item.category || "News");
    const date = escapeHtml(item.date || "");
    const desc = escapeHtml(item.description || "");
    const img = item.image ? String(item.image) : "";
    const link = item.link ? String(item.link) : "";

    const thumbStyle = img ? `style="background-image:url('${img}')" ` : "";
    const clickable = link ? "clickable" : "";

    return `
      <div class="card ${clickable}" ${link ? `data-link="${escapeHtml(link)}"` : ""} tabindex="${link ? "0" : "-1"}">
        <div class="thumb" ${thumbStyle}></div>
        <div class="cardBody">
          <div class="metaRow">
            <span class="pill2">${cat}</span>
            <span class="date">${date}</span>
          </div>
          <h3 class="title">${title}</h3>
          <p class="desc">${desc}</p>

          ${isAdmin() ? `
            <div class="actions">
              <button class="dangerBtn" type="button" data-del="${escapeHtml(item._id)}">Delete</button>
            </div>
          ` : ``}
        </div>
      </div>
    `;
  }

  function render(){
    const items = loadItems();

    if(!items.length){
      newsGrid.innerHTML = `<div class="empty">No news yet.</div>`;
      return;
    }

    newsGrid.innerHTML = items.map(cardTpl).join("");

    // ✅ فتح اللينك بالدوسة على الكارد (مش زر Open)
    newsGrid.querySelectorAll(".card.clickable").forEach(card=>{
      const link = card.getAttribute("data-link");
      if(!link) return;

      card.addEventListener("click", (e)=>{
        // لو ضغط على زر delete مايفتحش اللينك
        if(e.target && e.target.closest("[data-del]")) return;
        window.open(link, "_blank", "noopener");
      });

      card.addEventListener("keydown", (e)=>{
        if(e.key === "Enter" || e.key === " "){
          e.preventDefault();
          window.open(link, "_blank", "noopener");
        }
      });
    });

    // delete handlers
    if(isAdmin()){
      newsGrid.querySelectorAll("[data-del]").forEach(btn=>{
        btn.addEventListener("click", (e)=>{
          e.stopPropagation();
          const id = btn.getAttribute("data-del");
          const next = loadItems().filter(x => x._id !== id);
          saveItems(next);
          render();
        });
      });
    }
  }

  // Ctrl+Shift+M toggle
  document.addEventListener("keydown", (e)=>{
    if(e.ctrlKey && e.shiftKey && (e.key === "M" || e.key === "m")){
      e.preventDefault();
      setAdmin(!isAdmin());
    }
  });

  // Buttons
  if(addBtn) addBtn.addEventListener("click", openModal);
  if(closeModal) closeModal.addEventListener("click", closeModalFn);
  if(cancelBtn) cancelBtn.addEventListener("click", closeModalFn);
  modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModalFn(); });

  if(clearBtn){
    clearBtn.addEventListener("click", ()=>{
      // ✅ يمسح كل الأخبار المخزنة ويرجع seed من جديد
      localStorage.removeItem(LS_KEY);
      render();
    });
  }

  // Submit add
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = new FormData(form);

    const item = {
      _id: String(Date.now()) + Math.random().toString(16).slice(2),
      title: data.get("title")?.toString().trim() || "Untitled",
      date: data.get("date")?.toString() || "",
      category: data.get("category")?.toString().trim() || "News",
      image: data.get("image")?.toString().trim() || "",
      link: data.get("link")?.toString().trim() || "",
      description: data.get("description")?.toString().trim() || ""
    };

    const items = loadItems();
    items.unshift(item);
    saveItems(items);
    closeModalFn();
    render();
  });

  // Init
  adminBar.style.display = isAdmin() ? "flex" : "none";
  render();

  // If opened with ?admin=1 => persist
  if(new URLSearchParams(location.search).get("admin") === "1"){
    localStorage.setItem(LS_ADMIN, "1");
    adminBar.style.display = "flex";
  }
})();
