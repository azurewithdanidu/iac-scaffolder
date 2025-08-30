targetScope = 'subscription'



resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'landing-zone-rg'
  location: 'eastus'

}

resource monitorrg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'monitor-rg'
  location: 'eastus'

}


module law 'br/public:avm/res/operational-insights/workspace:0.12.0' = {
  scope: monitorrg
  params: {
    name: 'landing-zone-law'
  }
}

// similary other componet  like networks, nsg rules. nat gateways, keyvaults etc
// all the vaules neesd to be parameterized and naming needs to be consistent and calling from the naming module that we developing
// Thi  just a sample only 
