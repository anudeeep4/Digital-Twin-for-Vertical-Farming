// Three.js Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 15, 30);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 60;
controls.target.set(0, 5, 0);

// Lighting Setup
const growLight = new THREE.DirectionalLight(0xffffff, 1.2);
growLight.position.set(0, 10, 2);
growLight.castShadow = true;
growLight.shadow.mapSize.width = 1024;
growLight.shadow.mapSize.height = 1024;
scene.add(growLight);

const fillLight = new THREE.AmbientLight(0x88cc88, 0.4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x00ff44, 0.3);
rimLight.position.set(-5, 2, -5);
scene.add(rimLight);

const plantGroupOrigin = new THREE.Group();
scene.add(plantGroupOrigin);

let rootStrands = [];
let bubbles = [];
let allLeaves = [];
let models = [];

// Base plant pulse scale
let breathingScale = 1.0;
// Target root extent
let targetRootScale = 0.01;
// Overall data growth scale
let overallDataScale = 1.0;

function createLeafTextures() {
    // 1. Color Map
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#5da83a'); // leaf tips
    grad.addColorStop(0.6, '#82c45c'); // mid
    grad.addColorStop(1, '#e0f2cd'); // thick white stem base
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#c5edaa';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(256, 512);
    ctx.quadraticCurveTo(256, 256, 256 + (Math.random()*20-10), 20);
    ctx.stroke();

    for(let y = 400; y > 50; y -= 40) {
        ctx.lineWidth = (y / 512) * 8 + 2;
        ctx.beginPath();
        ctx.moveTo(256, y);
        ctx.quadraticCurveTo(150, y-30, 20 + Math.random()*50, y - 100 - Math.random()*50);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(256, y);
        ctx.quadraticCurveTo(362, y-30, 492 - Math.random()*50, y - 100 - Math.random()*50);
        ctx.stroke();
    }
    
    const imgData = ctx.getImageData(0,0,512,512);
    const data = imgData.data;
    for(let i=0; i<data.length; i+=4) {
        let noise = (Math.random()-0.5)*15;
        data[i] = Math.min(255, Math.max(0, data[i]+noise));
        data[i+1] = Math.min(255, Math.max(0, data[i+1]+noise));
        data[i+2] = Math.min(255, Math.max(0, data[i+2]+noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const colorMap = new THREE.CanvasTexture(canvas);

    // 2. Alpha Map
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = 512;
    alphaCanvas.height = 512;
    const aCtx = alphaCanvas.getContext('2d');
    
    aCtx.fillStyle = '#000000';
    aCtx.fillRect(0, 0, 512, 512);
    
    aCtx.fillStyle = '#ffffff';
    aCtx.beginPath();
    aCtx.moveTo(200, 512);
    aCtx.lineTo(312, 512);
    
    for(let y=400; y>=40; y-=15) {
        let x = 380 + Math.sin(y*0.1)*30 + Math.random()*20;
        aCtx.lineTo(x, y);
    }
    for(let x=380; x>=132; x-=15) {
        let y = 40 + Math.sin(x*0.15)*25 + Math.random()*20;
        aCtx.lineTo(x, y);
    }
    for(let y=40; y<=400; y+=15) {
        let x = 132 - Math.sin(y*0.1)*30 - Math.random()*20;
        aCtx.lineTo(x, y);
    }
    aCtx.lineTo(200, 512);
    aCtx.fill();
    
    aCtx.filter = 'blur(2px)';
    aCtx.drawImage(alphaCanvas, 0, 0);
    aCtx.filter = 'none';

    const alphaMap = new THREE.CanvasTexture(alphaCanvas);
    const bumpMap = new THREE.CanvasTexture(canvas);

    return { colorMap, alphaMap, bumpMap };
}

function createEnvironment() {
    // 1. Hydroponic Tray
    const trayGeo = new THREE.BoxGeometry(16, 2, 16);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0.1 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.y = -1;
    tray.receiveShadow = true;
    plantGroupOrigin.add(tray);

    // 2. Water Surface
    const waterGeo = new THREE.PlaneGeometry(15.5, 15.5);
    const waterMat = new THREE.MeshStandardMaterial({ 
        color: 0x225577, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.6
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.1;
    water.receiveShadow = true;
    plantGroupOrigin.add(water);

    // 3. Net Cup
    const cupGeo = new THREE.CylinderGeometry(1.2, 0.8, 1.5, 16);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, wireframe: true, transparent: true, opacity: 0.5 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = -0.8;
    plantGroupOrigin.add(cup);

    // 4. Roots
    const lineMat = new THREE.LineBasicMaterial({ color: 0xddddcc, transparent: true, opacity: 0.6 });
    for(let i=0; i<20; i++) {
        const points = [];
        const length = 4 + Math.random() * 6;
        const xOffset = (Math.random() - 0.5) * 1.5;
        const zOffset = (Math.random() - 0.5) * 1.5;
        
        points.push(new THREE.Vector3(xOffset, 0, zOffset));
        for(let j=1; j<=5; j++) {
            points.push(new THREE.Vector3(
                xOffset + (Math.random()-0.5)*2, 
                -j * (length/5), 
                zOffset + (Math.random()-0.5)*2
            ));
        }
        const rootGeo = new THREE.BufferGeometry().setFromPoints(points);
        const root = new THREE.Line(rootGeo, lineMat);
        root.scale.y = 0.01; 
        root.position.y = -1.5;
        plantGroupOrigin.add(root);
        rootStrands.push(root);
    }

    // 5. Bubbles
    const bubbleGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });
    for(let i=0; i<40; i++) {
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.set((Math.random()-0.5)*14, -2 + Math.random()*2, (Math.random()-0.5)*14);
        bubble.userData = { speed: 0.01 + Math.random()*0.02 };
        plantGroupOrigin.add(bubble);
        bubbles.push(bubble);
    }
}

const textures = createLeafTextures();

function buildStage1() {
    const group = new THREE.Group();
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xc8e6a0 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 1.25;
    group.add(stem);

    // Proto-Leaves
    const budGeo = new THREE.SphereGeometry(0.5, 16, 16);
    budGeo.scale(1, 0.2, 1);
    
    const bud1 = new THREE.Mesh(budGeo, stemMat);
    bud1.position.set(0.4, 2.5, 0);
    bud1.rotation.z = Math.PI/6;
    group.add(bud1);
    
    const bud2 = new THREE.Mesh(budGeo, stemMat);
    bud2.position.set(-0.4, 2.4, 0);
    bud2.rotation.z = -Math.PI/6;
    group.add(bud2);
    
    group.scale.set(0,0,0);
    plantGroupOrigin.add(group);
    return group;
}

function buildStage2() {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ 
        map: textures.colorMap, alphaMap: textures.alphaMap, bumpMap: textures.bumpMap, bumpScale: 0.05,
        transparent: true, alphaTest: 0.3, color: 0x6abf4b, side: THREE.DoubleSide, shininess: 20
    });

    const geo = new THREE.PlaneGeometry(6, 9, 20, 20);
    const pos = geo.attributes.position;
    for(let j=0; j<pos.count; j++) {
        let x = pos.getX(j), y = pos.getY(j); 
        let ny = (y + 4.5) / 9; let nx = x / 3; 
        let z = -(nx*nx) * 1.5 * ny; // cup backward
        if (ny > 0.4) z += Math.sin(nx * 15) * 0.15 * ny; // crinkles
        z += Math.sin(ny * 2) * 0.8; // bend
        pos.setZ(j, z);
    }
    geo.computeVertexNormals();
    geo.translate(0, 4.5, 0); 
    
    const leaf = new THREE.Mesh(geo, mat);
    leaf.castShadow = true; leaf.receiveShadow = true;
    leaf.userData = { baseRotX: 0.1, baseRotZ: 0, phaseOffset: Math.random() * 10, isSwaying: true };
    leaf.rotation.x = 0.1;
    group.add(leaf);
    allLeaves.push(leaf);

    // Short petiole
    const petioleGeo = new THREE.CylinderGeometry(0.3, 0.2, 1.5, 8);
    const petioleMat = new THREE.MeshStandardMaterial({ color: 0x8dc45c });
    const petiole = new THREE.Mesh(petioleGeo, petioleMat);
    petiole.position.y = 0.75;
    group.add(petiole);

    group.scale.set(0,0,0);
    plantGroupOrigin.add(group);
    return group;
}

function buildStage3_4(numLeaves, isStage3) {
    const group = new THREE.Group();
    const leafMatInner = new THREE.MeshPhongMaterial({ 
        map: textures.colorMap, alphaMap: textures.alphaMap, bumpMap: textures.bumpMap, bumpScale: 0.05,
        transparent: true, alphaTest: 0.3, color: 0xc5e87a, side: THREE.DoubleSide, shininess: 30
    });
    const leafMatMid = new THREE.MeshPhongMaterial({ ...leafMatInner.parameters, color: 0x7dc94e });
    const leafMatOuter = new THREE.MeshPhongMaterial({ ...leafMatInner.parameters, color: 0x3a8c2f });

    group.position.y = 0.5;

    for(let i = 0; i < numLeaves; i++) {
        let layerRatio = i / numLeaves; 
        let mat = layerRatio < 0.3 ? leafMatInner : (layerRatio < 0.7 ? leafMatMid : leafMatOuter);
        let w = 4 + layerRatio * 4.0; 
        let h = 5 + layerRatio * 4.5;
        
        const geo = new THREE.PlaneGeometry(w, h, 20, 20);
        const pos = geo.attributes.position;
        for(let j=0; j<pos.count; j++) {
            let x = pos.getX(j), y = pos.getY(j); 
            let ny = (y + h/2) / h; let nx = x / (w/2); 
            // inner leaves curl more
            let curlStrength = isStage3 ? 0.6 : (1.0 - layerRatio * 0.4); 
            let z = -(nx*nx) * 2.0 * curlStrength * ny; 
            z -= Math.sin(ny * Math.PI) * (isStage3 ? 0.8 : 1.5) * curlStrength; 
            if (ny > 0.4) {
                z += Math.sin(nx * 15) * 0.15 * ny;
                z += Math.cos(ny * 20) * 0.1 * ny;
            }
            pos.setZ(j, z);
        }
        geo.computeVertexNormals();
        geo.translate(0, h/2 - 0.5, 0); 

        const leaf = new THREE.Mesh(geo, mat);
        leaf.castShadow = true; leaf.receiveShadow = true;

        const phi = i * 137.5 * (Math.PI / 180); 
        let tilt;
        if (!isStage3) { 
            // Stage 4 Dome: wrap inner tightly, fan outer
            tilt = layerRatio < 0.3 ? (-0.3 + layerRatio) : ((layerRatio * layerRatio) * (Math.PI / 2 * 0.9));
        } else { 
            // Stage 3 Bowl: open radially
            tilt = 0.5 + layerRatio * 0.5; // ~30-60 deg
        }
        
        const radius = layerRatio * (isStage3 ? 1.0 : 1.8); 
        leaf.position.set(Math.sin(phi) * radius, layerRatio * 0.3, Math.cos(phi) * radius);
        
        leaf.userData = {
            baseRotX: tilt, baseRotZ: (Math.random() - 0.5) * 0.2, phaseOffset: Math.random() * 10, 
            layerRatio, isSwaying: true, index: i
        };
        leaf.rotation.set(tilt, phi, leaf.userData.baseRotZ);

        group.add(leaf);
        allLeaves.push(leaf);
    }
    group.scale.set(0,0,0);
    plantGroupOrigin.add(group);
    
    // Store original leaves so we can manipulate them dynamically
    group.userData = { allLeafMeshes: Array.from(group.children) }; 
    return group;
}

createEnvironment();
// Prebuild our 4 stages
models = [ 
    buildStage1(), 
    buildStage2(), 
    buildStage3_4(9, true), 
    buildStage3_4(18, false) 
];

let activeStageIndex = 0;
let currentScales = [0,0,0,0];
let targetScales = [0,0,0,0];

// Handle predictions
let tfwTarget = 0;
window.addEventListener('predictionSuccess', (e) => {
    const data = e.detail;
    
    // Update labels via DOM directly now
    let la = data.leaf_area;
    let sfw = data.shoot_fresh_weight;
    let rfw = data.root_fresh_weight;
    document.getElementById('label-leaves').innerText = `Leaves Area: ${la.toFixed(1)} cm²\nDry Wt: ${data.shoot_dry_weight.toFixed(2)} g`;
    document.getElementById('label-shoot').innerText = `Shoot (Fresh Wt): ${sfw.toFixed(1)} g`;
    document.getElementById('label-roots').innerText = `Roots (Fresh Wt): ${rfw.toFixed(1)} g\nDry Wt: ${data.root_dry_weight.toFixed(2)} g`;

    // Map stage
    let dat = data.days_after_transplant;
    if (dat === undefined) {
        const dInput = document.getElementById('dat') || document.getElementById('days');
        dat = dInput ? parseFloat(dInput.value) : 0;
    }
    
    let newStage = 0;
    if (dat >= 36) newStage = 3;      // Stage 4: Head (36-60d)
    else if (dat >= 19) newStage = 2; // Stage 3: Rosette (19-35d)
    else if (dat >= 8) newStage = 1;  // Stage 2: Single Leaf (8-18d)
    else newStage = 0;                // Stage 1: Seed/Sprout (1-7d)
    
    tfwTarget = data.total_fresh_weight || 0;
    
    activeStageIndex = newStage;
    for(let i=0; i<4; i++) {
        targetScales[i] = (i === newStage) ? 1.0 : 0.0;
    }
    
    // Calculate global scaling for the active stage using weight/dat
    if (newStage === 0) {
        overallDataScale = 0.5 + (dat / 7) * 1.5; // Scale up to 2x for seedling
    } else if (newStage === 1) {
        overallDataScale = 0.8 + (tfwTarget / 15) * 1.0; 
    } else if (newStage === 2) {
        overallDataScale = 0.6 + (tfwTarget / 60) * 0.8;
    } else {
        overallDataScale = 0.8 + (Math.min(tfwTarget, 150) / 150) * 0.6;
    }

    // Update Roots
    targetRootScale = 0.2 + (Math.min(rfw, 15) / 15) * 1.5;

    // Stage 3 specific: leaf counts grow with weight
    if (newStage === 2) {
        let maxLeaves = 9;
        let visibleCount = Math.floor(6 + (tfwTarget / 60) * 3);
        visibleCount = Math.max(6, Math.min(maxLeaves, visibleCount));
        
        let m3 = models[2];
        m3.userData.allLeafMeshes.forEach((leaf, idx) => {
            leaf.visible = (idx < visibleCount);
        });
    }

    // Send roots shooting down
    rootStrands.forEach(r => r.scale.y = 0.01);
});

// Update light color based on radiation
window.addEventListener('radiationChanged', (e) => {
    const val = e.detail;
    // Low (50-200): amber, Medium (200-500): white, High (500-800): blue-white
    if (val < 200) {
        growLight.color.setHex(0xffcc88);
    } else if (val < 500) {
        growLight.color.setHex(0xffffff);
    } else {
        growLight.color.setHex(0xcce0ff);
    }
});

// Loading pulse
window.addEventListener('predictionLoading', () => {
    fillLight.color.setHex(0x00ff88);
    setTimeout(() => {
         fillLight.color.setHex(0x88cc88);
    }, 1000);
});

// Simulation Loop
const clock = new THREE.Clock();
let isHovered = false;
container.addEventListener('mouseenter', () => isHovered = true);
container.addEventListener('mouseleave', () => isHovered = false);

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    controls.update();

    if(!isHovered) {
        plantGroupOrigin.rotation.y += 0.002; // slow turntable
    }

    // 1. Breathing logic
    breathingScale = 1.0 + Math.sin(time * (Math.PI / 1.5)) * 0.02; // 3 sec cycle

    // 2. Elastic dampening between stages
    for(let i=0; i<4; i++) {
        if (targetScales[i] > 0.5) {
            // Spring scale up
            currentScales[i] += (targetScales[i] - currentScales[i]) * 0.08; 
        } else {
            // Fast collapse down
            currentScales[i] += (targetScales[i] - currentScales[i]) * 0.2; 
        }

        let s = currentScales[i] * overallDataScale * breathingScale;
        models[i].scale.set(s, s, s);
        models[i].visible = (currentScales[i] > 0.01); 
    }

    // 3. Leaf Sway
    allLeaves.forEach((leaf, idx) => {
        if (!leaf.userData.isSwaying) return;
        const ud = leaf.userData;
        leaf.rotation.x = ud.baseRotX + Math.sin(time + idx * 0.5) * 0.03;
        leaf.rotation.z = ud.baseRotZ + Math.cos(time + idx * 0.5) * 0.03;
    });

    // 4. Roots logic
    rootStrands.forEach(root => {
        root.scale.y += (targetRootScale - root.scale.y) * 0.05;
    });

    // 5. Bubbles animating up
    bubbles.forEach(b => {
        b.position.y += b.userData.speed;
        if(b.position.y > -0.1) b.position.y = -2; // reset
    });

    // 6. Highlight Light shivering (specular animation)
    growLight.position.x = Math.sin(time * 0.5) * 2;
    growLight.position.z = 2 + Math.cos(time * 0.5) * 2;

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
