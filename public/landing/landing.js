const minLoadTime=800;
const startLoad=Date.now();
const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function share(){
    if(navigator.share){
        navigator.share({title:document.title,url:window.location.href}).catch(()=>{});
    }else{
        navigator.clipboard.writeText(window.location.href);
        const icon=document.getElementById('share-icon');
        icon.classList.remove('fa-share-nodes');
        icon.classList.add('fa-check');
        setTimeout(()=>{
            icon.classList.remove('fa-check');
            icon.classList.add('fa-share-nodes');
        },1500);
    }
}

function initReveal(){
    const items=document.querySelectorAll('.reveal');

    if(prefersReducedMotion){
        items.forEach(el=>el.classList.add('in'));
        return;
    }

    const observer=new IntersectionObserver((entries)=>{
        entries.forEach((entry,index)=>{
            if(entry.isIntersecting){
                setTimeout(()=>entry.target.classList.add('in'),index*90);
                observer.unobserve(entry.target);
            }
        });
    },{threshold:.1});

    items.forEach(el=>observer.observe(el));
}

function openSidebar(){
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
    document.getElementById('menu-toggle').setAttribute('aria-expanded','true');
    document.getElementById('sidebar').setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
}

function closeSidebar(){
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
    document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
    document.getElementById('sidebar').setAttribute('aria-hidden','true');
    document.body.style.overflow='';
}

document.getElementById('menu-toggle').addEventListener('click',openSidebar);
document.getElementById('sidebar-close').addEventListener('click',closeSidebar);
document.getElementById('sidebar-overlay').addEventListener('click',closeSidebar);

document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape')closeSidebar();
});

fetch('/config')
    .then(res=>res.json())
    .then(config=>{
        const name=config.settings.apiName;
        const desc=config.settings.description;

        document.getElementById('dash-title').innerText=name;
        document.getElementById('dash-desc').innerText=desc;
        document.getElementById('header-name').innerText=name;
        document.getElementById('sidebar-name').innerText=name;

        const thumbEl=document.getElementById('dash-thumb');
        thumbEl.src=config.settings.thumbnail;
        thumbEl.onerror=()=>{
            thumbEl.src='/thumbnail.svg';
        };

        const headerLogo=document.getElementById('header-logo');
        const sidebarLogo=document.getElementById('sidebar-logo');

        if(config.settings.favicon){
            document.getElementById('favicon').href=config.settings.favicon;
            headerLogo.src=config.settings.favicon;
            sidebarLogo.src=config.settings.favicon;
            headerLogo.classList.remove('hidden');
            sidebarLogo.classList.remove('hidden');
        }

        const elapsed=Date.now()-startLoad;
        const remaining=Math.max(0,minLoadTime-elapsed);

        setTimeout(()=>{
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('content').classList.remove('hidden');
            initReveal();
        },remaining);
    })
    .catch(()=>{
        document.getElementById('dash-title').innerText='NekoAPI';
        document.getElementById('dash-desc').innerText='Simple Dashboard Template';
        document.getElementById('header-name').innerText='NekoAPI';
        document.getElementById('sidebar-name').innerText='NekoAPI';

        setTimeout(()=>{
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('content').classList.remove('hidden');
            initReveal();
        },1000);
    });