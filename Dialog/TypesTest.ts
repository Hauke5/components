// 'use client'


// type INPUT_CFG<ITEM_TYPE>  = {id:keyof ITEM_TYPE, name: string}
// type OUTPUT_CFG = {attr: boolean}

// type INPUTS<ITEM_TYPE> = {[Property in keyof ITEM_TYPE]: INPUT_CFG<ITEM_TYPE>}[]

// type OUTPUTS<ITEM_TYPE> = {[Property in keyof ITEM_TYPE]: OUTPUT_CFG}


// type PROCESS<ITEM_TYPE> = (items:INPUTS<ITEM_TYPE>[])=> OUTPUTS<ITEM_TYPE>




// function inOutProcess<ITEM_TYPE>(inputs:INPUTS<ITEM_TYPE>):OUTPUTS<ITEM_TYPE> {
//    const result = {} as OUTPUTS<ITEM_TYPE>
//    inputs.forEach(input => {
//       result[Object.keys(input)[0]] = {attr:0} //as OUTPUT_CFG
//    })
//    return result
// }

// function test() {
//    const input = [
//       {a: {name:'drg'}},
//       {b: {name:'ftj'}},
//    ]
//    const output1 = inOutProcess([
//       {a: {name:'drg'}},
//       {b: {name:'ftj'}},
//    ])
//    const output2 = inOutProcess(input)
// }