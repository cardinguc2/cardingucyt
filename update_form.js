const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update handlePurchase
const old_handle_purchase = `  const handlePurchase = async () => {
    if (!playerId || !selectedPackage || !selectedPayment) {
      toast.error('Please complete all steps');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Check for network status before proceeding
      if (!navigator.onLine) {
        toast.error('Offline', {
          description: 'You appear to be offline. Please reconnect and try again.'
        });
        setIsProcessingPayment(false);
        return;
      }

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId, 
          packageId: selectedPackage.id,
          amount: selectedPackage.amount,
          price: selectedPackage.price,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to payment gateway page
        toast.success('Redirecting to Payment Gateway...', {
          description: \`Order ID: \${data.orderId}\`
        });
        setPaymentData({ url: data.paymentUrl, orderId: data.orderId });
        // Show payment dialog instead of immediate redirect
        setIsPaymentDialogOpen(true);
      } else if (data.success && !data.paymentUrl) {
        // Gateway returned success but no URL — show dialog with order info
        setPaymentData({ url: '', orderId: data.orderId });
        setIsPaymentDialogOpen(true);
        toast.success('Order Created', {
          description: 'Your order has been placed. Complete payment to receive UC.'
        });
      } else {
        toast.error('Payment Error', {
          description: data.error || 'Could not initiate secure transaction.',
          action: {
            label: 'Retry',
            onClick: () => handlePurchase()
          }
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('System Timeout', {
        description: 'Payment gateway is taking too long. Please try again or contact support.'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };`;

const new_handle_purchase = `  const handlePurchase = async () => {
    if (!playerId || !selectedPackage || !selectedPayment || !userInfo.name || !userInfo.email || !userInfo.phone) {
      toast.error('Please complete all steps and contact information');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Check for network status before proceeding
      if (!navigator.onLine) {
        toast.error('Offline', {
          description: 'You appear to be offline. Please reconnect and try again.'
        });
        setIsProcessingPayment(false);
        return;
      }

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId, 
          packageId: selectedPackage.id,
          amount: selectedPackage.amount,
          price: selectedPackage.price,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        toast.success('Redirecting to Payment Gateway...', {
          description: \`Order ID: \${data.orderId}\`
        });
        window.location.href = data.paymentUrl;
      } else if (data.success && !data.paymentUrl) {
        toast.success('Order Created', {
          description: 'Your order has been placed. Complete payment to receive UC.'
        });
      } else {
        toast.error('Payment Error', {
          description: data.error || 'Could not initiate secure transaction.',
          action: {
            label: 'Retry',
            onClick: () => handlePurchase()
          }
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('System Timeout', {
        description: 'Payment gateway is taking too long. Please try again or contact support.'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };`;

content = content.replace(old_handle_purchase, new_handle_purchase);

// 2. Update the form UI
const old_form_start = `          {/* Form Steps */}
          <div className="space-y-8 w-full">`;

const new_form_start = `          {/* Big Fillings Square Board */}
          <Card className="rounded-none border-4 border-primary/20 bg-card/40 backdrop-blur-md shadow-2xl p-6 sm:p-10 space-y-12 w-full glass-card">
            <div className="space-y-12 w-full">`;

content = content.replace(old_form_start, new_form_start);

// Change Step 1 Card styles
content = content.replace(/<Card className="border-border\/50 bg-card\/30 backdrop-blur-sm overflow-hidden glass-card">/g, '<div className="space-y-4">');
content = content.replace(/<CardHeader className="bg-primary\/5 border-b border-white\/5">/g, '<div className="mb-4">');
content = content.replace(/<\/CardHeader>/g, '</div>');
content = content.replace(/<CardContent className="pt-6">/g, '<div>');
content = content.replace(/<\/CardContent>\s*<\/Card>/g, '</div>\n              </div>');

// Make inputs bigger
content = content.replace('className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all text-base disabled:opacity-50"', 'className="pl-12 h-16 text-lg rounded-none border-2 bg-background/50 border-border/50 focus:border-primary/50 transition-all disabled:opacity-50"');
content = content.replace('className="h-12 px-6 font-bold uppercase tracking-tight gap-2"', 'className="h-16 px-8 text-lg font-bold uppercase rounded-none border-2 tracking-tight gap-2"');
content = content.replace('w-4 h-4 text-muted-foreground', 'w-5 h-5 text-muted-foreground');

// 3. Add contact info fields inside Step 3, before the Pay button
const old_integrated_purchase = `                  {/* Integrated Purchase Action */}
                  <div className="pt-6 border-t border-border/50">`;

const new_integrated_purchase = `                  {/* Contact Information */}
                  <div className="pt-8 border-t-2 border-border/50 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-none bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">4</div>
                      <h3 className="text-xl uppercase tracking-wider font-black italic">Contact Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Enter your name" 
                          value={userInfo.name}
                          onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                          className="h-14 rounded-none border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="Enter your email" 
                          value={userInfo.email}
                          onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                          className="h-14 rounded-none border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="Enter your phone" 
                          value={userInfo.phone}
                          onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                          className="h-14 rounded-none border-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Integrated Purchase Action */}
                  <div className="pt-6 border-t-2 border-border/50">`;

content = content.replace(old_integrated_purchase, new_integrated_purchase);

// Update Pay Button
const old_pay_button = `<Button 
                        className="w-full sm:w-auto min-w-[240px] h-14 text-lg font-black uppercase tracking-widest italic group overflow-hidden relative shadow-xl shadow-primary/20 gap-2"
                        disabled={!playerId || !selectedPackage || !selectedPayment || isProcessingPayment || isVerifying}
                        onClick={() => setIsUserInfoDialogOpen(true)}
                      >`;

const new_pay_button = `<Button 
                        className="w-full sm:w-auto min-w-[280px] h-16 text-xl rounded-none font-black uppercase tracking-widest italic group overflow-hidden relative shadow-2xl shadow-primary/30 gap-2"
                        disabled={!playerId || !selectedPackage || !selectedPayment || !userInfo.name || !userInfo.email || !userInfo.phone || isProcessingPayment || isVerifying}
                        onClick={handlePurchase}
                      >`;

content = content.replace(old_pay_button, new_pay_button);

// Add closing tag for the big card
const old_end_form = `            </motion.div>
          </div>
        </div>`;

const new_end_form = `            </motion.div>
          </div>
          </Card>
        </div>`;

content = content.replace(old_end_form, new_end_form);

// 4. Remove Dialogs
const user_info_start = content.indexOf('{/* User Info Dialog */}');
const footer_start = content.indexOf('{/* Footer */}');

if (user_info_start !== -1 && footer_start !== -1) {
    content = content.substring(0, user_info_start) + content.substring(footer_start);
}

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('App.tsx updated successfully.');
