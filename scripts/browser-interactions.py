"""Browser verification using the cloud environment's existing Playwright and Chromium.
Start the Vite development server before running this script.
"""
import asyncio,json,os
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.async_api import async_playwright
BASE=os.environ.get('WEARABLES_BASE_URL','http://127.0.0.1:5173')
OUT=Path(os.environ.get('WEARABLES_TEST_OUTPUT','/tmp/wearables-browser-checks'));OUT.mkdir(parents=True,exist_ok=True)

async def ready(page):
 await page.wait_for_load_state('networkidle')
async def main():
 checks=[];errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('WEARABLES_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  context=await browser.new_context(viewport={'width':1440,'height':1000})
  await context.add_init_script('localStorage.setItem("wba_cookie_consent","accepted");localStorage.setItem("wba_newsletter_dismissed","1");')
  page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE+'/product/embellished-lace-boubou');await ready(page)
  await page.get_by_role('button',name='M',exact=True).click()
  await page.get_by_role('button',name='ADD TO BAG',exact=True).first.click()
  await page.get_by_role('button',name='Add to wishlist',exact=True).click()
  await page.goto(BASE+'/wishlist');await ready(page);assert 'Embellished Lace Boubou' in await page.locator('main').inner_text()
  await page.reload();await ready(page);assert 'Embellished Lace Boubou' in await page.locator('main').inner_text();checks.append('Wishlist toggle and persistence')
  await page.goto(BASE+'/cart');await ready(page);assert 'Embellished Lace Boubou' in await page.locator('main').inner_text()
  await page.reload();await ready(page);assert 'Embellished Lace Boubou' in await page.locator('main').inner_text();checks.append('Add to cart and cart persistence')
  await page.goto(BASE+'/checkout?discount=0.1&coupon=WELCOME10');await ready(page)
  for key,value in {'firstName':'Demo','lastName':'Customer','email':'customer@demo.example','phone':'+2348000000000','address':'12 Example Street','city':'Lagos'}.items():
   await page.locator(f'[name="{key}"]').fill(value)
  await page.locator('[name="state"]').select_option('Lagos')
  await page.get_by_role('button',name='Simulate Payment',exact=False).click()
  await page.wait_for_url('**/order-confirmed?**');await ready(page)
  ref=parse_qs(urlparse(page.url).query)['ref'][0]
  data=await page.evaluate('JSON.parse(localStorage.getItem("wba_demo_v1"))')
  order=next(o for o in data['orders'] if o['ref']==ref)
  assert order['total']==108000 and order['paymentStatus']=='paid'
  assert data['emailActivity'][0]['type']=='order_confirmation'
  assert json.loads(await page.evaluate('localStorage.getItem("wba_demo_cart_guest")'))==[]
  checks.append('Discounted simulated checkout, saved order, empty cart, simulated confirmation email')
  await page.goto(BASE+'/contact');await ready(page)
  await page.get_by_placeholder('Your name',exact=True).fill('Demo Enquiry')
  await page.get_by_placeholder('your@email.com',exact=True).fill('sample@demo.example')
  await page.get_by_placeholder('How can we help?',exact=True).fill('Demo sizing question')
  await page.get_by_placeholder('Tell us more...',exact=True).fill('Could you help choose a size for this sample enquiry?')
  await page.locator('main').get_by_role('button',name='Send',exact=False).click()
  await page.wait_for_function('JSON.parse(localStorage.getItem("wba_demo_v1")).messages.some(m=>m.subject==="Demo sizing question")')
  checks.append('Contact form creates a local admin enquiry')
  await page.goto(BASE+'/account');await ready(page)
  await page.get_by_label('Email address',exact=True).fill('owner@demo.example');await page.get_by_label('Password',exact=True).fill('demo-password')
  await page.get_by_role('button',name='SIGN IN',exact=True).click();await page.wait_for_url('**/admin/dashboard');await ready(page)
  checks.append('Demo owner sign-in and dashboard access')
  await page.goto(BASE+'/admin/orders');await ready(page);assert ref in await page.locator('body').inner_text()
  await page.goto(BASE+'/admin/orders/'+order['id']);await ready(page)
  await page.locator('select').select_option('dispatched')
  await page.get_by_role('button',name='Save Changes',exact=True).click()
  await page.wait_for_function('(id)=>JSON.parse(localStorage.getItem("wba_demo_v1")).orders.find(o=>o.id===id).status==="dispatched"',arg=order['id'])
  await page.goto(BASE+'/track');await ready(page)
  await page.get_by_placeholder('e.g. WBA-DEMO-0001').fill(ref);await page.get_by_placeholder('Email used at checkout').fill('customer@demo.example')
  await page.get_by_role('button',name='TRACK ORDER',exact=True).click()
  await page.wait_for_selector('text=Demo order status: dispatched')
  checks.append('Admin order update is reflected in customer tracking')
  await page.goto(BASE+'/admin/messages');await ready(page);assert 'Demo sizing question' in await page.locator('body').inner_text()
  checks.append('Customer enquiry appears in admin messages')
  await page.goto(BASE+'/admin/products');await ready(page)
  await page.get_by_title('Edit',exact=True).first.click()
  await page.get_by_placeholder('e.g. Embellished Lace Boubou',exact=True).fill('Demo Edited Boubou')
  await page.get_by_role('button',name='Save Changes',exact=True).click()
  await page.wait_for_function('JSON.parse(localStorage.getItem("wba_demo_v1")).products.some(p=>p.name==="Demo Edited Boubou")')
  await page.goto(BASE+'/shop');await ready(page);assert 'Demo Edited Boubou' in await page.locator('main').inner_text()
  await page.goto(BASE+'/');await ready(page);assert 'Demo Edited Boubou' in await page.locator('main').inner_text()
  checks.append('Admin product edits appear in shop and homepage')
  await page.goto(BASE+'/admin/media');await ready(page)
  await page.locator('input[type="file"]').set_input_files(str(Path(__file__).resolve().parents[1]/'public/logo.png'))
  await page.wait_for_function('JSON.parse(localStorage.getItem("wba_demo_media_library")).some(url=>url.startsWith("data:image/"))')
  await page.wait_for_function('Array.from(document.images).some(img=>img.currentSrc.startsWith("data:image/") && img.complete && img.naturalWidth>0)')
  checks.append('Image upload produces a persistent browser-only preview')
  await page.goto(BASE+'/');await ready(page)
  # Contact links must never hand off to a real email or messaging service.
  await page.locator('a[href^="mailto:"]').first.click()
  await page.wait_for_selector('text=Demo contact action simulated. No message or call was sent.')
  checks.append('External contact action simulated locally')
  assert not errors,errors
  await browser.close()
 (OUT/'interaction-check.json').write_text(json.dumps({'checks':checks,'runtime_errors':errors},indent=2));print('PASSED',checks,flush=True)
asyncio.run(main())
