"""Browser verification using the cloud environment's existing Playwright and Chromium.
Start the Vite development server before running this script.
"""
import asyncio, json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright

ARTIFACTS=Path(os.environ.get('WEARABLES_TEST_OUTPUT','/tmp/wearables-browser-checks'));ARTIFACTS.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('WEARABLES_BASE_URL','http://127.0.0.1:5173')
PUBLIC=['/', '/shop', '/cart', '/account', '/about', '/contact', '/wholesale', '/custom-order', '/track', '/wishlist', '/checkout', '/order-confirmed', '/faq', '/shipping', '/size-guide', '/returns', '/terms', '/privacy', '/does-not-exist']
CATEGORIES=['new-in','ready-to-wear','jewellery','fabrics','turbans','wholesale','sale','ashabi','exclusive','limited-edition']
PRODUCTS=['embellished-lace-boubou','aso-oke-occasion-gown','luxury-kaftan-set','woven-turban-set','gold-statement-necklace','ashabi-signature-dress','damask-iro-buba-set','kente-fabric-yard','velvet-evening-kaftan','bridal-aso-oke']
ADMIN=['dashboard','orders','orders/demo-order-1','newsletter','messages','products','media','collections','coupons','customers','content','settings','users','audit','custom-orders','wholesale','reviews','flyers']

async def wait_ready(page):
 await page.wait_for_load_state('networkidle')
 await page.wait_for_function('document.querySelector("#main-content, main, h1") && document.body.innerText.length > 100')
 await page.evaluate('document.fonts.ready')

async def main():
 results=[]; errors=[]; bad_responses=[]; external=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('WEARABLES_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  for label, width, height in [('desktop',1440,1000),('mobile',390,844)]:
   context=await browser.new_context(viewport={'width':width,'height':height})
   await context.add_init_script('localStorage.setItem("wba_cookie_consent","accepted");localStorage.setItem("wba_newsletter_dismissed","1");')
   async def route_request(route):
    if urlparse(route.request.url).hostname not in ['127.0.0.1','localhost']:
     external.append(route.request.url); await route.abort()
    else: await route.continue_()
   await context.route('**/*',route_request)
   page=await context.new_page()
   page.on('pageerror',lambda error: errors.append({'page':page.url,'error':str(error)}))
   page.on('response',lambda response: bad_responses.append({'page':page.url,'url':response.url,'status':response.status}) if response.status>=400 else None)
   await page.goto(BASE+'/product/embellished-lace-boubou'); await wait_ready(page)
   await page.get_by_role('button',name='M',exact=True).click()
   await page.get_by_role('button',name='ADD TO BAG',exact=True).first.click()
   for path in PUBLIC+[f'/shop/{c}' for c in CATEGORIES]+[f'/product/{slug}' for slug in PRODUCTS]+['/product/not-a-product']:
    await page.goto(BASE+path); await wait_ready(page)
    await page.locator('img').evaluate_all('(imgs)=>imgs.forEach(img=>img.loading="eager")')
    await page.wait_for_function('Array.from(document.images).every(img=>img.complete)',timeout=10000)
    broken=await page.locator('img').evaluate_all('(imgs)=>imgs.filter(img=>img.currentSrc && img.naturalWidth===0).map(img=>img.currentSrc)')
    overflow=await page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
    content=await page.locator('body').inner_text()
    assert 'Unexpected Application Error' not in content and 'Something went wrong' not in content, path
    if path=='/shop': assert '10 products' in content
    if path=='/checkout': assert 'simulate payment' in content.lower(),(page.url,content[:400])
    if path=='/product/not-a-product': assert '404' in content
    assert not broken, (path,broken)
    assert not overflow, (path, "page exceeds viewport width")
    results.append({'viewport':label,'route':path,'rendered':True,'broken_images':broken,'horizontal_overflow':overflow})
    if path in ['/','/shop','/product/embellished-lace-boubou','/checkout']:
     await page.screenshot(path=str(ARTIFACTS/(label+'-'+('home' if path=='/' else path.strip('/').replace('/','-'))+'.png')),full_page=True)
   await page.goto(BASE+'/account'); await wait_ready(page)
   await page.get_by_label('Email address',exact=True).fill('owner@demo.example')
   await page.get_by_label('Password',exact=True).fill('demo-password')
   await page.get_by_role('button',name='SIGN IN',exact=True).click()
   await page.wait_for_url('**/admin/dashboard'); await wait_ready(page)
   for path in ['/admin']+[f'/admin/{a}' for a in ADMIN]:
    await page.goto(BASE+path); await wait_ready(page)
    assert '/account' not in page.url
    content=await page.locator('body').inner_text()
    assert 'Unexpected Application Error' not in content and 'Access Denied' not in content and 'Something went wrong' not in content,path
    await page.locator('img').evaluate_all('(imgs)=>imgs.forEach(img=>img.loading="eager")')
    await page.wait_for_function('Array.from(document.images).every(img=>img.complete)',timeout=10000)
    broken=await page.locator('img').evaluate_all('(imgs)=>imgs.filter(img=>img.currentSrc && img.naturalWidth===0).map(img=>img.currentSrc)')
    assert not broken,(path,broken)
    overflow=await page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
    assert not overflow,(path, 'page exceeds viewport width')
    results.append({'viewport':label,'route':path,'rendered':True,'broken_images':broken,'horizontal_overflow':overflow})
    if path in ['/admin/dashboard','/admin/products']:
     await page.screenshot(path=str(ARTIFACTS/(label+'-'+path.strip('/').replace('/','-')+'.png')),full_page=True)
   await context.close()
   print(label,'routes passed:',sum(r['viewport']==label for r in results),flush=True)
  await browser.close()
 report={'routes':results,'runtime_errors':errors,'http_errors':bad_responses,'external_requests':external}
 (ARTIFACTS/'route-smoke.json').write_text(json.dumps(report,indent=2))
 print('Total routes checked:',len(results),'runtime errors:',errors,'HTTP errors:',bad_responses,'external requests:',external,flush=True)
 assert not errors and not bad_responses and not external
asyncio.run(main())
